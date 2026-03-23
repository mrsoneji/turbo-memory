import { ApiProperty } from '@nestjs/swagger';
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

export class CreateOrderItemDto {
  @ApiProperty()
  @IsMongoId()
  productId: string;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'INV-2026-001', required: false })
  @IsString()
  @MinLength(1)
  @IsOptional()
  invoiceNumber?: string;

  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @MinLength(1)
  clientName: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
