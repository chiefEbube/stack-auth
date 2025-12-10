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

    // Attach user and key data to request
    request.user = { id: keyData.userId, type: 'api-key' };
    request.apiKey = keyData;

    return true;
  }

  private extractApiKey(request: any): string | null {
    return (
      request.headers['x-api-key'] ||
      request.headers['api-key'] ||
      request.query?.api_key ||
      null
    );
  }
}
