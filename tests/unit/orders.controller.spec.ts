import { Test } from '@nestjs/testing';
import { OrdersController } from '../../src/orders/orders.controller';
import { OrdersService } from '../../src/orders/orders.service';
import { CreateOrderDto } from '../../src/transport/http/orders/create-order.dto';
import { UpdateOrderDto } from '../../src/transport/http/orders/update-order.dto';

const makeOrdersService = () => ({
  listOrders: jest.fn(),
  getById: jest.fn(),
  createOrder: jest.fn(),
  updateById: jest.fn(),
  getTotalSoldLastMonth: jest.fn(),
  getHighestTotalOrder: jest.fn(),
});

describe('OrdersController', () => {
  it('calls listOrders with query', async () => {
    const ordersService = makeOrdersService();
    ordersService.listOrders.mockResolvedValue([]);

    const moduleRef = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: ordersService }],
    }).compile();

    const controller = moduleRef.get(OrdersController);
    await controller.list({ page: 2, limit: 5, clientContains: 'ac', invoiceNumber: 'INV-1' } as any);
    expect(ordersService.listOrders).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
      clientContains: 'ac',
      invoiceNumber: 'INV-1',
    });
  });

  it('calls getById', async () => {
    const ordersService = makeOrdersService();
    ordersService.getById.mockResolvedValue({ id: '1' });

    const moduleRef = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: ordersService }],
    }).compile();

    const controller = moduleRef.get(OrdersController);
    await controller.getById('1');
    expect(ordersService.getById).toHaveBeenCalledWith('1');
  });

  it('calls createOrder mapping items', async () => {
    const ordersService = makeOrdersService();
    ordersService.createOrder.mockResolvedValue({ id: '1' });

    const moduleRef = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: ordersService }],
    }).compile();

    const controller = moduleRef.get(OrdersController);
    await controller.create({
      invoiceNumber: 'INV-1',
      clientName: 'Acme',
      items: [{ productId: 'p1', quantity: 2 }],
    } as CreateOrderDto);

    expect(ordersService.createOrder).toHaveBeenCalledWith({
      invoiceNumber: 'INV-1',
      clientName: 'Acme',
      items: [{ productId: 'p1', quantity: 2 }],
    });
  });

  it('calls updateById mapping items', async () => {
    const ordersService = makeOrdersService();
    ordersService.updateById.mockResolvedValue({ id: '1' });

    const moduleRef = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: ordersService }],
    }).compile();

    const controller = moduleRef.get(OrdersController);
    await controller.update('1', { invoiceNumber: 'INV-2', items: [{ productId: 'p1', quantity: 3 }] } as UpdateOrderDto);
    expect(ordersService.updateById).toHaveBeenCalledWith('1', {
      invoiceNumber: 'INV-2',
      clientName: undefined,
      items: [{ productId: 'p1', quantity: 3 }],
    });
  });

  it('calls getTotalSoldLastMonth', async () => {
    const ordersService = makeOrdersService();
    ordersService.getTotalSoldLastMonth = jest.fn().mockResolvedValue(100);

    const moduleRef = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: ordersService }],
    }).compile();

    const controller = moduleRef.get(OrdersController);
    const result = await controller.getTotalSoldLastMonth();
    expect(result.total).toBe(100);
  });

  it('calls getHighestTotalOrder', async () => {
    const ordersService = makeOrdersService();
    ordersService.getHighestTotalOrder = jest.fn().mockResolvedValue({ id: '1' });

    const moduleRef = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: ordersService }],
    }).compile();

    const controller = moduleRef.get(OrdersController);
    const result = await controller.getHighestTotalOrder();
    expect(result.order).toEqual({ id: '1' });
  });
});
