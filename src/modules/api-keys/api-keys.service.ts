import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { ApiKey, ApiKeyPermission } from './api-key.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RolloverApiKeyDto } from './dto/rollover-api-key.dto';

@Injectable()
export class ApiKeysService {
  private readonly MAX_ACTIVE_KEYS = 5;
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {}

  async createApiKey(
    userId: string,
    dto: CreateApiKeyDto,
  ): Promise<{ apiKey: ApiKey; rawKey: string }> {
    // Check active keys count
    const activeKeysCount = await this.countActiveKeys(userId);
    if (activeKeysCount >= this.MAX_ACTIVE_KEYS) {
      throw new BadRequestException(
        `Maximum ${this.MAX_ACTIVE_KEYS} active API keys allowed`,
      );
    }

    // Generate API key
    const rawKey = this.generateApiKey();
    const hashedKey = await this.hashApiKey(rawKey);

    // Calculate expiry
    const expiresAt = this.calculateExpiry(dto.expiry);

    // Create API key
    const apiKey = this.apiKeyRepository.create({
      userId,
      hashedKey,
      rawKey, // Store temporarily for return
      permissions: dto.permissions,
      expiresAt,
      // Note: name field can be stored in metadata if needed
    });

    const saved = await this.apiKeyRepository.save(apiKey);

    // Return raw key only once
    return {
      apiKey: saved,
      rawKey: `sk_live_${rawKey}`,
    };
  }

  async rolloverApiKey(
    userId: string,
    dto: RolloverApiKeyDto,
  ): Promise<{ apiKey: ApiKey; rawKey: string }> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id: dto.expired_key_id, userId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    // Only rollover expired keys
    if (!apiKey.expiresAt || apiKey.expiresAt > new Date()) {
      throw new BadRequestException('Can only rollover expired API keys');
    }

    if (apiKey.revokedAt) {
      throw new BadRequestException('Cannot rollover revoked API key');
    }

    // Generate new key
    const rawKey = this.generateApiKey();
    const hashedKey = await this.hashApiKey(rawKey);

    // Update with new key and expiry
    apiKey.hashedKey = hashedKey;
    apiKey.rawKey = rawKey; // Store temporarily
    apiKey.expiresAt = this.calculateExpiry(dto.expiry);
    apiKey.revokedAt = null; // Reset revocation

    const saved = await this.apiKeyRepository.save(apiKey);

    return {
      apiKey: saved,
      rawKey: `sk_live_${rawKey}`,
    };
  }

  async revokeApiKey(userId: string, keyId: string): Promise<void> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id: keyId, userId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    apiKey.revokedAt = new Date();
    await this.apiKeyRepository.save(apiKey);
  }

  async validateApiKey(
    rawKey: string,
  ): Promise<{ userId: string; permissions: ApiKeyPermission[] } | null> {
    // Remove prefix if present
    const key = rawKey.replace(/^sk_live_/, '');

    // Find all active keys (we'll check hash)
    const now = new Date();
    const apiKeys = await this.apiKeyRepository
      .createQueryBuilder('key')
      .where('key.revokedAt IS NULL')
      .andWhere('(key.expiresAt IS NULL OR key.expiresAt > :now)', { now })
      .getMany();

    // Check each key
    for (const apiKey of apiKeys) {
      const isValid = await bcrypt.compare(key, apiKey.hashedKey);
      if (isValid) {
        return {
          userId: apiKey.userId,
          permissions: apiKey.permissions,
        };
      }
    }

    return null;
  }

  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    return this.apiKeyRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  private async countActiveKeys(userId: string): Promise<number> {
    const now = new Date();
    return this.apiKeyRepository
      .createQueryBuilder('key')
      .where('key.userId = :userId', { userId })
      .andWhere('key.revokedAt IS NULL')
      .andWhere('(key.expiresAt IS NULL OR key.expiresAt > :now)', { now })
      .getCount();
  }

  private generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async hashApiKey(key: string): Promise<string> {
    return bcrypt.hash(key, this.SALT_ROUNDS);
  }

  private calculateExpiry(expiry: string): Date {
    const now = new Date();
    const [value, unit] = [expiry.slice(0, -1), expiry.slice(-1)];

    switch (unit) {
      case 'H':
        return new Date(now.getTime() + parseInt(value) * 60 * 60 * 1000);
      case 'D':
        return new Date(now.getTime() + parseInt(value) * 24 * 60 * 60 * 1000);
      case 'M':
        return new Date(now.setMonth(now.getMonth() + parseInt(value)));
      case 'Y':
        return new Date(now.setFullYear(now.getFullYear() + parseInt(value)));
      default:
        throw new BadRequestException('Invalid expiry format');
    }
  }
}
