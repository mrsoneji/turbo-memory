import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export class SearchProductsDto {
  @ApiPropertyOptional({ minimum: 1, example: '' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, example: '' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ example: '', enum: ['name', 'sku', 'price', 'createdAt'] })
  @IsString()
  @IsIn(['name', 'sku', 'price', 'createdAt'])
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ enum: SortDirection, example: '' })
  @IsEnum(SortDirection)
  @IsOptional()
  sortDir?: SortDirection;

  @ApiPropertyOptional({ example: 'Product Name' })
  @IsString()
  @MinLength(1)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Product' })
  @IsString()
  @MinLength(1)
  @IsOptional()
  nameContains?: string;

  @ApiPropertyOptional({ example: 'SKU-123' })
  @IsString()
  @MinLength(1)
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number;
}
