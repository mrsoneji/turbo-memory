import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'Product Name' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: 'SKU-123' })
  @IsString()
  @MinLength(1)
  sku: string;

  @ApiProperty({ type: 'string', format: 'binary' })
  picture: unknown;

  @ApiProperty({ minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;
}
