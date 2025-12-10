import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { seedDatabase } from './seed';
import { User } from '../../modules/users/user.entity';
import { Wallet } from '../../modules/wallet/wallet.entity';
import { ApiKey } from '../../modules/api-keys/api-key.entity';
import { Transaction } from '../../modules/transactions/transaction.entity';

config();

async function runSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wallet_db',
    entities: [User, Wallet, ApiKey, Transaction],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('📦 Database connected');

    await seedDatabase(dataSource);

    await dataSource.destroy();
    console.log('✅ Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

runSeed();
