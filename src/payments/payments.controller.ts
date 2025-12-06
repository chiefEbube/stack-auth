import { Controller, Post, Get, Body, Headers, Param, Query, Req, BadRequestException, UnauthorizedException, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
// Note: Uncomment and configure when you have JWT auth set up
// import { AuthGuard } from '@nestjs/passport';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('paystack/initiate')
  // @UseGuards(AuthGuard('jwt')) // Uncomment when JWT auth is implemented
  @HttpCode(HttpStatus.CREATED)
  async initiatePayment(
    @Body() dto: InitiatePaymentDto,
    @Req() req: Request & { user?: { id: string } }
  ) {
    // For now, extract user_id from body or request
    // When JWT auth is implemented, use: const userId = req.user.id;
    const userId = req.body.user_id || req.user?.id;
    
    if (!userId) {
      throw new BadRequestException('User ID is required. Please authenticate or provide user_id in request.');
    }
    
    return this.paymentsService.initializePayment(userId, dto.amount);
  }

  @Post('paystack/webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('x-paystack-signature') signature: string, 
    @Req() req: any
  ) {
    if (!signature) {
      throw new UnauthorizedException('No signature provided');
    }

    // Body is raw Buffer from express.raw() middleware
    const rawBody = req.body;
    const bodyString = rawBody.toString('utf8');
    const body = JSON.parse(bodyString);

    const isValid = this.paymentsService.verifyWebhookSignature(signature, rawBody);
    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }

    await this.paymentsService.processWebhook(body);
    return { status: true };
  }

  @Get(':reference/status')
  async checkStatus(
    @Param('reference') reference: string,
    @Query('refresh') refresh?: string
  ) {
    const shouldRefresh = refresh === 'true';
    return this.paymentsService.verifyTransactionStatus(reference, shouldRefresh);
  }
}