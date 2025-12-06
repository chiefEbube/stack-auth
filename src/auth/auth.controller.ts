import { Controller, Get, Query, Res, BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ApiGoogleAuth, ApiGoogleCallback } from './swagger/auth.swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Get('google')
    @ApiGoogleAuth()
    async googleAuth(@Res() res: any) {
        try {
            const authUrl = await this.authService.getGoogleAuthUrl();
            return res.json({ google_auth_url: authUrl });
        } catch (error) {
            throw new InternalServerErrorException('Failed to generate Google auth URL');
        }
    }

    @Get('google/callback')
    @ApiGoogleCallback()
    async googleCallback(
        @Query('code') code: string,
        @Query('state') state: string,
        @Query('error') error: string
    ) {
        if (error) {
            throw new BadRequestException(`OAuth error: ${error}`);
        }

        if (!code) {
            throw new BadRequestException('Missing authorization code');
        }

        try {
            const user = await this.authService.handleGoogleCallback(code, state);
            return {
                user_id: user.id,
                email: user.email,
                name: user.name
            };
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new InternalServerErrorException('Provider error');
        }
    }
}
