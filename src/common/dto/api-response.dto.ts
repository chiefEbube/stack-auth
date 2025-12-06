import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthUrlResponseDto {
  @ApiProperty({
    description: 'Google OAuth authorization URL',
    example: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=...',
  })
  google_auth_url: string;
}

export class GoogleCallbackResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  user_id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  name: string;
}

export class InitiatePaymentResponseDto {
  @ApiProperty({
    description: 'Transaction reference',
    example: 'T1234567890',
  })
  reference: string;

  @ApiProperty({
    description: 'Paystack authorization URL for payment',
    example: 'https://checkout.paystack.com/T1234567890',
  })
  authorization_url: string;
}

export class TransactionStatusResponseDto {
  @ApiProperty({
    description: 'Transaction reference',
    example: 'T1234567890',
  })
  reference: string;

  @ApiProperty({
    description: 'Transaction status',
    enum: ['pending', 'success', 'failed'],
    example: 'success',
  })
  status: string;

  @ApiProperty({
    description: 'Transaction amount in Kobo',
    example: 5000,
  })
  amount: number;

  @ApiProperty({
    description: 'Payment timestamp in ISO format',
    example: '2024-01-15T10:30:00.000Z',
    nullable: true,
  })
  paid_at: string | null;
}

export class WebhookResponseDto {
  @ApiProperty({
    description: 'Webhook processing status',
    example: true,
  })
  status: boolean;
}

