import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  CanActivate,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class JwtOrApiKeyGuard implements CanActivate {
  private jwtGuard: any;
  private apiKeyGuard: any;

  constructor(private moduleRef: ModuleRef) {
    // Initialize guards
    this.jwtGuard = new (AuthGuard('jwt'))();
    this.apiKeyGuard = new (AuthGuard('api-key'))();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Try JWT first
    const jwtToken = this.extractJwtToken(request);
    if (jwtToken) {
      try {
        const jwtResult = await this.jwtGuard.canActivate(context);
        if (jwtResult) {
          const user = await this.jwtGuard.handleRequest(null, request.user, null);
          request.user = { ...user, type: 'jwt' };
          return true;
        }
      } catch (error) {
        // JWT failed, try API key
      }
    }

    // Try API key
    const apiKey = this.extractApiKey(request);
    if (apiKey) {
      try {
        const apiKeyResult = await this.apiKeyGuard.canActivate(context);
        if (apiKeyResult) {
          const user = await this.apiKeyGuard.handleRequest(null, request.user, null);
          request.user = { ...user, type: 'api-key' };
          request.apiKey = user;
          return true;
        }
      } catch (error) {
        // API key failed
      }
    }

    throw new UnauthorizedException('Authentication required');
  }

  private extractJwtToken(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
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
