import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/user.entity';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    private readonly googleTokenUrl = 'https://oauth2.googleapis.com/token';
    private readonly googleUserInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
    private stateStore: Map<string, number> = new Map();
    private readonly STATE_EXPIRY = 10 * 60 * 1000;

    constructor(
        private usersService: UsersService,
        private configService: ConfigService,
    ) {}

    async getGoogleAuthUrl(): Promise<string> {
        const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
        const redirectUri = this.configService.get<string>('GOOGLE_CALLBACK_URL');
        
        if (!clientId || !redirectUri) {
            throw new InternalServerErrorException('Google OAuth configuration is missing');
        }
        
        const state = this.generateState();
        
        this.stateStore.set(state, Date.now());

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'openid email profile',
            state: state,
            access_type: 'offline',
        } as Record<string, string>);

        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    async handleGoogleCallback(code: string, state: string): Promise<User> {
        if (!code) {
            throw new InternalServerErrorException('Missing authorization code');
        }

        if (!this.validateState(state)) {
            throw new UnauthorizedException('Invalid state parameter');
        }

        try {
            // Exchange code for tokens
            const tokens = await this.exchangeCodeForTokens(code);
            
            // Fetch user info
            const userInfo = await this.fetchUserInfo(tokens.access_token);
            
            // Create or update user
            const user = await this.usersService.findOrCreate({
                email: userInfo.email,
                name: `${userInfo.given_name} ${userInfo.family_name}`,
                picture: userInfo.picture,
                sub: userInfo.id,
            });

            return user;
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new InternalServerErrorException('Provider error');
        }
    }

    private async exchangeCodeForTokens(code: string) {
        const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
        const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
        const redirectUri = this.configService.get<string>('GOOGLE_CALLBACK_URL');

        if (!clientId || !clientSecret || !redirectUri) {
            throw new InternalServerErrorException('Google OAuth configuration is missing');
        }

        try {
            const response = await axios.post(this.googleTokenUrl, {
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            });

            return response.data;
        } catch (error) {
            throw new UnauthorizedException('Invalid authorization code');
        }
    }

    private async fetchUserInfo(accessToken: string) {
        try {
            const response = await axios.get(this.googleUserInfoUrl, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            return response.data;
        } catch (error) {
            throw new UnauthorizedException('Failed to fetch user info');
        }
    }

    generateState(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    validateState(state: string): boolean {
        if (!state) {
            return false;
        }

        const timestamp = this.stateStore.get(state);
        if (!timestamp) {
            return false;
        }

        if (Date.now() - timestamp > this.STATE_EXPIRY) {
            this.stateStore.delete(state);
            return false;
        }

        this.stateStore.delete(state);
        return true;
    }
}
