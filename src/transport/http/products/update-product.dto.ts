import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateProductDto {
  @ApiPropertyOptional({
    example: '',
    nullable: true,
    description: 'Optional. Empty string is treated as not provided.',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MinLength(1)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: '',
    nullable: true,
    description: 'Optional. Empty string is treated as not provided.',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MinLength(1)
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  picture?: unknown;

  @ApiPropertyOptional({
    minimum: 0,
    nullable: true,
    description: 'Optional. Empty string is treated as not provided.',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;
}
