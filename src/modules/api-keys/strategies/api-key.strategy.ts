import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { ApiKeysService } from '../api-keys.service';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private apiKeysService: ApiKeysService) {
    super((request: Request, done: (error: any, user?: any) => void) => {
      this.validate(request)
        .then((user) => done(null, user))
        .catch((error) => done(error, null));
    });
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
    return (
      (request.headers['x-api-key'] as string) ||
      (request.headers['api-key'] as string) ||
      (request.query?.api_key as string) ||
      null
    );
  }
}
