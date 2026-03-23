import { ApiProperty } from '@nestjs/swagger';
import { OrderResponseDto } from './order-response.dto';

export class TotalSoldLastMonthDto {
  @ApiProperty()
  total: number;
}

export class HighestTotalOrderDto {
  @ApiProperty({ nullable: true, type: OrderResponseDto })
  order: OrderResponseDto | null;
}
