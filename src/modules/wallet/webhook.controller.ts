import {
  Controller,
  Post,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { WalletService } from './wallet.service';
import { PaystackService } from '../paystack/paystack.service';

@ApiTags('wallet')
@Controller('wallet/paystack')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly walletService: WalletService,
    private readonly paystackService: PaystackService,
  ) {}

  @Post('webhook')
  @ApiExcludeEndpoint()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    // Get raw body for signature verification
    // Note: For production, configure NestJS to preserve raw body
    // See WEBHOOK_SETUP.md for details
    const signature = req.headers['x-paystack-signature'] as string;
    
    // Try to get raw body from request (if middleware preserved it)
    const rawBody = (req as any).rawBody 
      ? (req as any).rawBody.toString('utf8')
      : JSON.stringify(req.body);

    // Verify signature
    const isValid = this.paystackService.verifyWebhookSignature(
      rawBody,
      signature,
    );

    if (!isValid) {
      this.logger.warn('Invalid webhook signature');
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = req.body;

    // Only process charge.success events
    if (event.event === 'charge.success') {
      const { reference, amount } = event.data;

      try {
        await this.walletService.processWebhookDeposit(reference, amount);
        this.logger.log(`Successfully processed deposit for reference: ${reference}`);
      } catch (error) {
        this.logger.error(
          `Failed to process webhook for reference ${reference}:`,
          error,
        );
        // Still return 200 to prevent Paystack from retrying
      }
    }

    return res.status(200).json({ status: true });
  }
}
