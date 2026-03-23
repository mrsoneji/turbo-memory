import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class UpdateOrderItemDto {
  @ApiPropertyOptional()
  @IsMongoId()
  productId: string;

  @ApiPropertyOptional({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class UpdateOrderDto {
  @ApiPropertyOptional({ example: 'Acme Corp' })
  @IsString()
  @MinLength(1)
  @IsOptional()
  clientName?: string;

  @ApiPropertyOptional({ type: [UpdateOrderItemDto] })
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderItemDto)
  @IsOptional()
  items?: UpdateOrderItemDto[];
}
