import { IsString, IsInt, IsPositive, Min, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferDto {
  @ApiProperty({
    description: 'Recipient wallet number (12-14 digits)',
    example: '4566678954356',
  })
  @IsString()
  @Length(12, 14)
  wallet_number: string;

  @ApiProperty({
    description: 'Amount to transfer in kobo',
    example: 3000,
    minimum: 100,
  })
  @IsInt()
  @IsPositive()
  @Min(100)
  amount: number;
}
