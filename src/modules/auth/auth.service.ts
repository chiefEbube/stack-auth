import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private configService: ConfigService,
        private jwtService: JwtService,
    ) {}

  getGoogleAuthUrl(): string {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const callbackUrl = this.configService.get<string>('GOOGLE_CALLBACK_URL');
    const scopes = ['email', 'profile'];

    if (!clientId || !callbackUrl) {
      throw new InternalServerErrorException('Google OAuth configuration is missing');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async validateGoogleUser(profile: any): Promise<{ user: User; token: string }> {
    const { googleId, email, name, avatar } = profile;
            
            // Create or update user
            const user = await this.usersService.findOrCreate({
      email,
      name,
      avatar,
      googleId,
            });

            // Generate JWT token
            const token = this.generateJwtToken(user);

            return { user, token };
    }

    private generateJwtToken(user: User): string {
        const payload = { sub: user.id, email: user.email };
        return this.jwtService.sign(payload);
    }
}
