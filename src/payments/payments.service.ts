import { BadRequestException, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction, TransactionStatus } from './transaction.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
    constructor(
        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private configService: ConfigService,
    ) { }

    async initializePayment(userId: string, amount: number) {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Validate amount (must be positive integer in Kobo)
        if (!amount || amount <= 0 || !Number.isInteger(amount)) {
            throw new BadRequestException('Invalid amount. Amount must be a positive integer in Kobo');
        }

        const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');

        // Check for existing pending transaction (idempotency)
        // Look for recent pending transaction with same user and amount (within last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const existingTransaction = await this.transactionRepository.findOne({
            where: { 
                user: { id: userId },
                amount: amount,
                status: TransactionStatus.PENDING
            },
            order: { createdAt: 'DESC' }
        });

        // If transaction exists and was created recently, return it
        if (existingTransaction && existingTransaction.createdAt >= fiveMinutesAgo) {
            // Reconstruct authorization URL (Paystack format)
            return {
                reference: existingTransaction.reference,
                authorization_url: `https://checkout.paystack.com/${existingTransaction.reference}`
            };
        }

        try {
            const response = await axios.post(
                'https://api.paystack.co/transaction/initialize',
                {
                    email: user.email,
                    amount: amount,
                },
                {
                    headers: {
                        Authorization: `Bearer ${secretKey}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            const { reference, authorization_url } = response.data.data;

            const transaction = this.transactionRepository.create({
                user,
                amount,
                reference,
                status: TransactionStatus.PENDING
            });

            await this.transactionRepository.save(transaction);
            return {reference, authorization_url};
        } catch (error) {
            // Handle Paystack API errors
            if (error.response?.status === 402 || error.response?.data?.status === false) {
                throw new HttpException(
                    'Payment initiation failed',
                    HttpStatus.PAYMENT_REQUIRED // 402
                );
            }
            throw new HttpException(
                'Payment initialization failed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    verifyWebhookSignature(signature: string, rawBody: Buffer | string): boolean {
        const secret = this.configService.get<string>('PAYSTACK_SECRET_KEY');
        if (!secret) {
            throw new BadRequestException('Paystack secret key not configured');
        }
        
        // Paystack signs the raw body string, not JSON stringified
        const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
        const hash = crypto
            .createHmac('sha512', secret)
            .update(bodyString)
            .digest('hex');

        return hash === signature;
    }

    async processWebhook(event: any) {
        if (event.event === 'charge.success') {
            const { reference, paid_at } = event.data;

            const transaction = await this.transactionRepository.findOne({ where: { reference } });
            if (transaction) {
                transaction.status = TransactionStatus.SUCCESS;
                transaction.paidAt = paid_at ? new Date(paid_at) : new Date();
                await this.transactionRepository.save(transaction);
            }
        } else if (event.event === 'charge.failed') {
            const { reference } = event.data;
            const transaction = await this.transactionRepository.findOne({ where: { reference } });
            
            if (transaction) {
                transaction.status = TransactionStatus.FAILED;
                await this.transactionRepository.save(transaction);
            }
        }
    }

    async verifyTransactionStatus(reference: string, refresh: boolean = false){
        const transaction = await this.transactionRepository.findOne({ 
            where: { reference },
            relations: ['user']
        });
        
        if (!transaction) {
            throw new BadRequestException('Transaction not found');
        }

        // Return DB status if refresh is not requested and status is final
        if (!refresh && 
            (transaction.status === TransactionStatus.SUCCESS || 
             transaction.status === TransactionStatus.FAILED)) {
            return {
                reference: transaction.reference,
                status: transaction.status,
                amount: transaction.amount,
                paid_at: transaction.paidAt?.toISOString() || null
            };
        }

        // Fetch live status from Paystack
        const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
        
        try {
            const response = await axios.get(
                `https://api.paystack.co/transaction/verify/${reference}`,
                { 
                    headers: { Authorization: `Bearer ${secretKey}` }
                },
            );

            const paystackData = response.data.data;
            const paystackStatus = paystackData.status;

            if (paystackStatus === 'success') {
                transaction.status = TransactionStatus.SUCCESS;
                transaction.paidAt = paystackData.paid_at ? new Date(paystackData.paid_at) : new Date();
            } else if (paystackStatus === 'failed') {
                transaction.status = TransactionStatus.FAILED;
            }

            await this.transactionRepository.save(transaction);

            return {
                reference: transaction.reference,
                status: transaction.status,
                amount: transaction.amount,
                paid_at: transaction.paidAt?.toISOString() || null
            };
        } catch (error) {
            return {
                reference: transaction.reference,
                status: transaction.status,
                amount: transaction.amount,
                paid_at: transaction.paidAt?.toISOString() || null
            };
        }
    }

}
