import { Controller, Post, Get, Body, Param, Req, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { ApiInitiatePayment, ApiCheckStatus } from './swagger/payments.swagger';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('paystack/initiate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiInitiatePayment()
  @HttpCode(HttpStatus.CREATED)
  async initiatePayment(
    @Body() dto: InitiatePaymentDto,
    @Req() req: Request & { user: { id: string } }
  ) {
    const userId = req.user.id;
    
    return this.paymentsService.initializePayment(userId, dto.amount);
  }

  @Get(':reference/status')
  @ApiCheckStatus()
  async checkStatus(
    @Param('reference') reference: string
  ) {
    return this.paymentsService.verifyTransactionStatus(reference);
  }
}