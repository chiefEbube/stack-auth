import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RolloverApiKeyDto {
  @ApiProperty({
    description: 'Expired API key ID to rollover',
    example: 'FGH2485K6KK79GKG9GKGK',
  })
  @IsNotEmpty()
  expired_key_id: string;

  @ApiProperty({
    description: 'New expiry duration',
    enum: ['1H', '1D', '1M', '1Y'],
    example: '1M',
  })
  @IsEnum(['1H', '1D', '1M', '1Y'])
  @IsNotEmpty()
  expiry: '1H' | '1D' | '1M' | '1Y';
}
