import { IsInt, Min, IsPositive } from 'class-validator';

export class InitiatePaymentDto {
  @IsInt()
  @Min(1)
  @IsPositive()
  amount: number; // Amount in Kobo
}

