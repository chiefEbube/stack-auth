import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { ApiKeysService } from '../api-keys.service';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private apiKeysService: ApiKeysService) {
    super();
  }

  async validate(request: Request): Promise<any> {
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    const keyData = await this.apiKeysService.validateApiKey(apiKey);
    if (!keyData) {
      throw new UnauthorizedException('Invalid or expired API key');
    }

    return {
      id: keyData.userId,
      type: 'api-key',
      permissions: keyData.permissions,
    };
  }

  private extractApiKey(request: Request): string | null {
    if (request.headers['x-api-key']) {
      return request.headers['x-api-key'] as string;
    }
    
    if (request.headers['api-key']) {
      return request.headers['api-key'] as string;
    }
    
    if (request.query?.api_key) {
      return request.query.api_key as string;
    }
    
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token.startsWith('sk_live_')) {
        return token;
      }
    }
    
    return null;
  }
}
