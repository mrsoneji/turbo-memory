import { ApiProperty } from '@nestjs/swagger';

export class OrderItemSnapshotDto {
  @ApiProperty()
  productId: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  lineTotal: number;
}

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  clientName: string;

  @ApiProperty()
  total: number;

  @ApiProperty({ type: [OrderItemSnapshotDto] })
  items: OrderItemSnapshotDto[];
}
