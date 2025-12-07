import { BadRequestException, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction, TransactionStatus } from './transaction.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

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


    async verifyTransactionStatus(reference: string){
        // First check if transaction exists in our database
        const transaction = await this.transactionRepository.findOne({ 
            where: { reference },
            relations: ['user']
        });
        
        if (!transaction) {
            throw new BadRequestException('Transaction not found');
        }

        // Always verify with Paystack to get the latest status
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

            // Update transaction status based on Paystack response
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
            // Return database status as fallback
            return {
                reference: transaction.reference,
                status: transaction.status,
                amount: transaction.amount,
                paid_at: transaction.paidAt?.toISOString() || null
            };
        }
    }

}
