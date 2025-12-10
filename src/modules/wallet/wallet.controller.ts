import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { DepositDto } from './dto/deposit.dto';
import { TransferDto } from './dto/transfer.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtOrApiKeyGuard } from '../../common/guards/jwt-or-api-key.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { ApiKeyPermissions } from '../../common/decorators/api-key-permissions.decorator';

@ApiTags('wallet')
@Controller('wallet')
@UseGuards(JwtOrApiKeyGuard, PermissionGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('deposit')
  @ApiKeyPermissions('deposit')
  @ApiOperation({ summary: 'Initialize Paystack deposit' })
  @HttpCode(HttpStatus.CREATED)
  async deposit(
    @CurrentUser() user: { id: string },
    @Body() dto: DepositDto,
  ) {
    return this.walletService.initializeDeposit(user.id, dto);
  }

  @Get('deposit/:reference/status')
  @ApiKeyPermissions('read')
  @ApiOperation({ summary: 'Check deposit status' })
  async getDepositStatus(
    @CurrentUser() user: { id: string },
    @Param('reference') reference: string,
  ) {
    return this.walletService.getDepositStatus(user.id, reference);
  }

  @Get('balance')
  @ApiKeyPermissions('read')
  @ApiOperation({ summary: 'Get wallet balance' })
  async getBalance(@CurrentUser() user: { id: string }) {
    return this.walletService.getBalance(user.id);
  }

  @Post('transfer')
  @ApiKeyPermissions('transfer')
  @ApiOperation({ summary: 'Transfer funds to another wallet' })
  @HttpCode(HttpStatus.OK)
  async transfer(
    @CurrentUser() user: { id: string },
    @Body() dto: TransferDto,
  ) {
    return this.walletService.transfer(user.id, dto);
  }

  @Get('transactions')
  @ApiKeyPermissions('read')
  @ApiOperation({ summary: 'Get wallet transactions' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getTransactions(
    @CurrentUser() user: { id: string },
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.walletService.getTransactions(
      user.id,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }
}
