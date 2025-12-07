import { IsInt, Min, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiatePaymentDto {
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
