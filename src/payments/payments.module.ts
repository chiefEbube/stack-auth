import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { User } from 'src/users/user.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        TypeOrmModule.forFeature([Transaction, User]),
        ConfigModule
    ],
    providers: [PaymentsService],
    controllers: [PaymentsController],
})
export class PaymentsModule {}
