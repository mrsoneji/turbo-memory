import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export enum OrderSortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export class SearchOrdersDto {
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

  @ApiPropertyOptional({ example: '', enum: ['clientName', 'total', 'createdAt'] })
  @IsString()
  @IsIn(['clientName', 'total', 'createdAt'])
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ enum: OrderSortDirection, example: '' })
  @IsEnum(OrderSortDirection)
  @IsOptional()
  sortDir?: OrderSortDirection;

  @ApiPropertyOptional({ example: '' })
  @IsString()
  @MinLength(1)
  @IsOptional()
  clientName?: string;

  @ApiPropertyOptional({ example: '' })
  @IsString()
  @MinLength(1)
  @IsOptional()
  clientContains?: string;
}
