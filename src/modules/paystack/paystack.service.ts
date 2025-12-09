import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

export interface InitializePaymentDto {
  email: string;
  amount: number; // in kobo
  metadata?: Record<string, any>;
}

export interface PaystackTransactionResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackWebhookEvent {
  event: string;
  data: {
    reference: string;
    amount: number;
    status: string;
    customer: {
      email: string;
    };
    metadata?: Record<string, any>;
  };
}

@Injectable()
export class PaystackService {
  private readonly axiosInstance: AxiosInstance;
  private readonly secretKey: string;
  private readonly publicKey: string;
  private readonly webhookSecret: string;

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
    this.publicKey = this.configService.get<string>('PAYSTACK_PUBLIC_KEY') || '';
    this.webhookSecret = this.configService.get<string>('PAYSTACK_WEBHOOK_SECRET') || '';

    this.axiosInstance = axios.create({
      baseURL: 'https://api.paystack.co',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async initializePayment(
    dto: InitializePaymentDto,
  ): Promise<PaystackTransactionResponse> {
    try {
      const response = await this.axiosInstance.post(
        '/transaction/initialize',
        {
          email: dto.email,
          amount: dto.amount,
          metadata: dto.metadata,
        },
      );

      return response.data;
    } catch (error: any) {
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to initialize payment',
      );
    }
  }

  async verifyTransaction(reference: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(
        `/transaction/verify/${reference}`,
      );
      return response.data;
    } catch (error: any) {
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to verify transaction',
      );
    }
  }

  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
  ): boolean {
    if (!signature) {
      return false;
    }

    const hash = crypto
      .createHmac('sha512', this.webhookSecret)
      .update(payload)
      .digest('hex');

    return hash === signature;
  }

  getPublicKey(): string {
    return this.publicKey;
  }
}
