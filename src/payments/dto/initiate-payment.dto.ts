import { IsInt, Min, IsPositive, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiatePaymentDto {
  @ApiProperty({
    description: 'User ID (UUID) - obtained from Google OAuth callback',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsString()
  @IsUUID()
  user_id: string;

  @ApiProperty({
    description: 'Payment amount in Kobo (lowest currency unit)',
    example: 5000,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsPositive()
  amount: number;
}
