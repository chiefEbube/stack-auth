import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeysService } from '../../modules/api-keys/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    const keyData = await this.apiKeysService.validateApiKey(apiKey);
    if (!keyData) {
      throw new UnauthorizedException('Invalid API key');
    }

    request.user = { id: keyData.userId, type: 'api-key' };
    request.apiKey = keyData;

    return true;
  }

  private extractApiKey(request: any): string | null {
    if (request.headers['x-api-key']) {
      return request.headers['x-api-key'];
    }
    
    if (request.headers['api-key']) {
      return request.headers['api-key'];
    }
    
    if (request.query?.api_key) {
      return request.query.api_key;
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
