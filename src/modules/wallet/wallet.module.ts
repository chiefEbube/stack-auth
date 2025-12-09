import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletController } from './wallet.controller';
import { WebhookController } from './webhook.controller';
import { WalletService } from './wallet.service';
import { Wallet } from './wallet.entity';
import { Transaction } from '../transactions/transaction.entity';
import { PaystackModule } from '../paystack/paystack.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, Transaction]),
    PaystackModule,
  ],
  controllers: [WalletController, WebhookController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
