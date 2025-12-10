import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Wallet } from './wallet.entity';
import { Transaction, TransactionType, TransactionStatus } from '../transactions/transaction.entity';
import { PaystackService } from '../paystack/paystack.service';
import { DepositDto } from './dto/deposit.dto';
import { TransferDto } from './dto/transfer.dto';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private paystackService: PaystackService,
    private dataSource: DataSource,
  ) {}

  async createWallet(userId: string): Promise<Wallet> {
    const walletNumber = this.generateWalletNumber();

    const wallet = this.walletRepository.create({
      userId,
      walletNumber,
      balance: '0',
    });

    return this.walletRepository.save(wallet);
  }

  async getWalletByUserId(userId: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async getWalletByNumber(walletNumber: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { walletNumber },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async getBalance(userId: string): Promise<{ balance: number }> {
    const wallet = await this.getWalletByUserId(userId);
    return { balance: Number(wallet.balance) };
  }

  async getWalletInfo(userId: string): Promise<{
    wallet_number: string;
    balance: number;
  }> {
    const wallet = await this.getWalletByUserId(userId);
    return {
      wallet_number: wallet.walletNumber,
      balance: Number(wallet.balance),
    };
  }

  async initializeDeposit(
    userId: string,
    dto: DepositDto,
  ): Promise<{ reference: string; authorization_url: string }> {
    const wallet = await this.getWalletByUserId(userId);

    // Check for existing pending transaction (idempotency)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingTransaction = await this.transactionRepository.findOne({
      where: {
        walletId: wallet.id,
        amount: dto.amount,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
    });

    if (
      existingTransaction &&
      existingTransaction.createdAt >= fiveMinutesAgo
    ) {
      return {
        reference: existingTransaction.reference!,
        authorization_url: `https://checkout.paystack.com/${existingTransaction.reference}`,
      };
    }

    // Get user email (need to load user relation)
    const walletWithUser = await this.walletRepository.findOne({
      where: { id: wallet.id },
      relations: ['user'],
    });

    if (!walletWithUser) {
      throw new NotFoundException('Wallet not found');
    }

    // Initialize Paystack payment
    const paystackResponse = await this.paystackService.initializePayment({
      email: walletWithUser.user.email,
      amount: dto.amount,
      metadata: {
        walletId: wallet.id,
        userId,
      },
    });

    // Create transaction record
    const transaction = this.transactionRepository.create({
      walletId: wallet.id,
      amount: dto.amount,
      type: TransactionType.DEPOSIT,
      status: TransactionStatus.PENDING,
      reference: paystackResponse.data.reference,
      metadata: {
        authorization_url: paystackResponse.data.authorization_url,
      },
    });

    await this.transactionRepository.save(transaction);

    return {
      reference: paystackResponse.data.reference,
      authorization_url: paystackResponse.data.authorization_url,
    };
  }

  async processWebhookDeposit(
    reference: string,
    amount: number,
  ): Promise<void> {
    // Check if transaction already processed (idempotency)
    const existingTransaction = await this.transactionRepository.findOne({
      where: { reference },
      relations: ['wallet'],
    });

    if (!existingTransaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (existingTransaction.status === TransactionStatus.SUCCESS) {
      return; // Already processed
    }

    // Use database transaction for atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update transaction status
      existingTransaction.status = TransactionStatus.SUCCESS;
      await queryRunner.manager.save(existingTransaction);

      // Credit wallet
      const wallet = existingTransaction.wallet;
      const currentBalance = BigInt(wallet.balance);
      wallet.balance = (currentBalance + BigInt(amount)).toString();
      await queryRunner.manager.save(wallet);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Failed to process deposit');
    } finally {
      await queryRunner.release();
    }
  }

  async transfer(
    senderUserId: string,
    dto: TransferDto,
  ): Promise<{ status: string; message: string }> {
    const senderWallet = await this.getWalletByUserId(senderUserId);
    const recipientWallet = await this.getWalletByNumber(
      dto.wallet_number,
    );

    if (senderWallet.id === recipientWallet.id) {
      throw new BadRequestException('Cannot transfer to own wallet');
    }

    // Check balance
    const senderBalance = BigInt(senderWallet.balance);
    const recipientBalance = BigInt(recipientWallet.balance);

    if (senderBalance < BigInt(dto.amount)) {
      throw new BadRequestException('Insufficient balance');
    }

    // Atomic transfer using database transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Deduct from sender
      senderWallet.balance = (senderBalance - BigInt(dto.amount)).toString();
      await queryRunner.manager.save(senderWallet);

      // Credit recipient
      recipientWallet.balance = (recipientBalance + BigInt(dto.amount)).toString();
      await queryRunner.manager.save(recipientWallet);

      // Create sender transaction
      const senderTransaction = this.transactionRepository.create({
        walletId: senderWallet.id,
        amount: dto.amount,
        type: TransactionType.TRANSFER,
        status: TransactionStatus.SUCCESS,
        metadata: {
          recipientWalletNumber: dto.wallet_number,
          recipientWalletId: recipientWallet.id,
        },
      });
      await queryRunner.manager.save(senderTransaction);

      // Create recipient transaction
      const recipientTransaction = this.transactionRepository.create({
        walletId: recipientWallet.id,
        amount: dto.amount,
        type: TransactionType.TRANSFER,
        status: TransactionStatus.SUCCESS,
        metadata: {
          senderWalletNumber: senderWallet.walletNumber,
          senderWalletId: senderWallet.id,
        },
      });
      await queryRunner.manager.save(recipientTransaction);

      await queryRunner.commitTransaction();

      return {
        status: 'success',
        message: 'Transfer completed',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Transfer failed');
    } finally {
      await queryRunner.release();
    }
  }

  async getTransactions(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<Transaction[]> {
    const wallet = await this.getWalletByUserId(userId);
    return this.transactionRepository.find({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getDepositStatus(
    userId: string,
    reference: string,
  ): Promise<{
    reference: string;
    status: TransactionStatus;
    amount: number;
  }> {
    const wallet = await this.getWalletByUserId(userId);
    const transaction = await this.transactionRepository.findOne({
      where: { walletId: wallet.id, reference },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      reference: transaction.reference!,
      status: transaction.status,
      amount: Number(transaction.amount),
    };
  }

  private generateWalletNumber(): string {
    // Generate 12-14 digit wallet number
    const min = 100000000000; // 12 digits
    const max = 99999999999999; // 14 digits
    const number = Math.floor(Math.random() * (max - min + 1)) + min;
    return number.toString();
  }
}
