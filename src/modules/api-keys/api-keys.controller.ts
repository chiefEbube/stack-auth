import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RolloverApiKeyDto } from './dto/rollover-api-key.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('api-keys')
@Controller('keys')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new API key' })
  @HttpCode(HttpStatus.CREATED)
  async createApiKey(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateApiKeyDto,
  ) {
    const result = await this.apiKeysService.createApiKey(user.id, dto);
    return {
      api_key: result.rawKey,
      expires_at: result.apiKey.expiresAt?.toISOString() || null,
    };
  }

  @Post('rollover')
  @ApiOperation({ summary: 'Rollover an expired API key' })
  async rolloverApiKey(
    @CurrentUser() user: { id: string },
    @Body() dto: RolloverApiKeyDto,
  ) {
    const result = await this.apiKeysService.rolloverApiKey(user.id, dto);
    return {
      api_key: result.rawKey,
      expires_at: result.apiKey.expiresAt?.toISOString() || null,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke an API key' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeApiKey(
    @CurrentUser() user: { id: string },
    @Param('id') keyId: string,
  ) {
    await this.apiKeysService.revokeApiKey(user.id, keyId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all API keys for current user' })
  async getUserApiKeys(@CurrentUser() user: { id: string }) {
    const keys = await this.apiKeysService.getUserApiKeys(user.id);
    return keys.map((key) => ({
      id: key.id,
      permissions: key.permissions,
      expires_at: key.expiresAt,
      revoked_at: key.revokedAt,
      created_at: key.createdAt,
      is_active: !key.revokedAt && (!key.expiresAt || key.expiresAt > new Date()),
    }));
  }
}
