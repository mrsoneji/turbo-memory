import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.schema';
import { CreateOrderDto } from '../transport/http/orders/create-order.dto';
import { UpdateOrderDto } from '../transport/http/orders/update-order.dto';
import { OrderResponseDto } from '../transport/http/orders/order-response.dto';
import { SearchOrdersDto } from '../transport/http/orders/search-orders.dto';
import { HighestTotalOrderDto, TotalSoldLastMonthDto } from '../transport/http/orders/order-metrics.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.User)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List orders (authenticated user)' })
  @ApiQuery({ name: 'page', required: false, example: '' })
  @ApiQuery({ name: 'limit', required: false, example: '' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['clientName', 'total', 'createdAt'], example: '' })
  @ApiQuery({ name: 'sortDir', required: false, enum: ['asc', 'desc'], example: '' })
  @ApiQuery({ name: 'clientName', required: false, example: '' })
  @ApiQuery({ name: 'clientContains', required: false, example: '' })
  @ApiQuery({ name: 'invoiceNumber', required: false, example: '' })
  @ApiResponse({ status: 200, description: 'List of orders', type: OrderResponseDto, isArray: true })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  list(@Query() query?: SearchOrdersDto) {
    return this.ordersService.listOrders(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by id (authenticated user)' })
  @ApiResponse({ status: 200, description: 'Order', type: OrderResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  getById(@Param('id') id: string) {
    return this.ordersService.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create order (authenticated user)' })
  @ApiResponse({ status: 201, description: 'Order created', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder({
      invoiceNumber: dto.invoiceNumber,
      clientName: dto.clientName,
      items: dto.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    });
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update order by id (authenticated user)',
    description: 'If items are provided, they replace all items and totals are recalculated.',
  })
  @ApiResponse({ status: 200, description: 'Order updated', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.updateById(id, {
      invoiceNumber: dto.invoiceNumber,
      clientName: dto.clientName,
      items: dto.items?.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    });
  }

  @Get('metrics/total-sold-last-month')
  @ApiOperation({ summary: 'Get total sold price within the last month' })
  @ApiResponse({ status: 200, description: 'Total sold in last month', type: TotalSoldLastMonthDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getTotalSoldLastMonth() {
    const total = await this.ordersService.getTotalSoldLastMonth();
    return { total };
  }

  @Get('metrics/highest-total')
  @ApiOperation({ summary: 'Get the order with the highest total amount' })
  @ApiResponse({ status: 200, description: 'Highest total order', type: HighestTotalOrderDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getHighestTotalOrder() {
    const order = await this.ordersService.getHighestTotalOrder();
    return { order };
  }
}
