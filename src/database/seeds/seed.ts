import { DataSource } from 'typeorm';
import { User } from '../../modules/users/user.entity';
import { Wallet } from '../../modules/wallet/wallet.entity';
import * as bcrypt from 'bcryptjs';
import { ApiKey } from '../../modules/api-keys/api-key.entity';
import * as crypto from 'crypto';

export async function seedDatabase(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);
  const walletRepository = dataSource.getRepository(Wallet);
  const apiKeyRepository = dataSource.getRepository(ApiKey);

  console.log('🌱 Seeding database...');

  // Create test user
  const testUser = userRepository.create({
    email: 'test@example.com',
    name: 'Test User',
    googleId: 'test-google-id-123',
    avatar: 'https://example.com/avatar.jpg',
  });

  const savedUser = await userRepository.save(testUser);
  console.log('✅ Created test user:', savedUser.email);

  // Create wallet for test user
  const wallet = walletRepository.create({
    userId: savedUser.id,
    walletNumber: '12345678901234',
    balance: '1000000',
  });

  const savedWallet = await walletRepository.save(wallet);
  console.log('✅ Created wallet:', savedWallet.walletNumber);

  // Create API key for testing
  const rawKey = crypto.randomBytes(32).toString('hex');
  const hashedKey = await bcrypt.hash(rawKey, 10);
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now

  const apiKey = apiKeyRepository.create({
    userId: savedUser.id,
    hashedKey,
    rawKey: `sk_live_${rawKey}`, // Store for reference (normally not stored)
    permissions: ['deposit', 'transfer', 'read'],
    expiresAt,
  });

  const savedApiKey = await apiKeyRepository.save(apiKey);
  console.log('Created API key:', savedApiKey.id);
  console.log('Test API Key:', `sk_live_${rawKey}`);
  console.log('(Store this securely - it will not be shown again)');

  console.log('Seeding completed!');
}
