import { IsInt, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DepositDto {
  @ApiProperty({
    description: 'Amount to deposit in kobo (smallest currency unit)',
    example: 500000,
    minimum: 100, // Minimum 1 Naira
  })
  @IsInt()
  @IsPositive()
  @Min(100)
  amount: number;
}
