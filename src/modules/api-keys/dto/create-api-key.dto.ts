import { IsEnum, IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApiKeyPermission } from '../api-key.entity';

export class CreateApiKeyDto {
  @ApiProperty({
    description: 'API key name',
    example: 'wallet-service',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'API key permissions',
    enum: ['deposit', 'transfer', 'read'],
    isArray: true,
    example: ['deposit', 'read'],
  })
  @IsArray()
  @IsEnum(['deposit', 'transfer', 'read'], { each: true })
  @IsNotEmpty()
  permissions: ApiKeyPermission[];

  @ApiProperty({
    description: 'Expiry duration',
    enum: ['1H', '1D', '1M', '1Y'],
    example: '1D',
  })
  @IsEnum(['1H', '1D', '1M', '1Y'])
  @IsNotEmpty()
  expiry: '1H' | '1D' | '1M' | '1Y';
}
