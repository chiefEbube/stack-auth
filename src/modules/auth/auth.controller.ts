import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { ApiGoogleAuth } from './swagger/auth.swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Get('google')
    @ApiGoogleAuth()
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // This will redirect to Google OAuth
    }

    @Get('google/callback')
    @ApiExcludeEndpoint()
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: ExpressRequest, @Query('error') error: string) {
        if (error) {
            throw new BadRequestException(`OAuth error: ${error}`);
        }

    const profile = (req as any).user;
    const { user, token } = await this.authService.validateGoogleUser(profile);

            return {
                user_id: user.id,
                email: user.email,
                name: user.name,
      avatar: user.avatar,
      token,
            };
    }
}
