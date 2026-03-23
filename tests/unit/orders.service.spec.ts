import { OrdersService } from '../../src/orders/orders.service';

const makeOrderModel = () => {
  let lastFilter: any;
  let lastSort: any;
  let lastSkip: any;
  let lastLimit: any;
  const model: any = {
    create: jest.fn(),
    find: jest.fn().mockImplementation((filter?: any) => {
      lastFilter = filter;
      return {
        sort: (sort: any) => {
          lastSort = sort;
          return {
            skip: (skip: number) => {
              lastSkip = skip;
              return {
                limit: (limit: number) => {
                  lastLimit = limit;
                  return {
                    exec: () => [
                      {
                        _id: '1',
                        clientName: 'Acme',
                        total: 20,
                        items: [
                          {
                            productId: 'p1',
                            sku: 'SKU-1',
                            name: 'Prod',
                            unitPrice: 10,
                            quantity: 2,
                            lineTotal: 20,
                          },
                        ],
                      },
                    ],
                  };
                },
              };
            },
          };
        },
        exec: () => [],
      };
    }),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    __getLast: () => ({ lastFilter, lastSort, lastSkip, lastLimit }),
  };
  return model;
};

describe('OrdersService', () => {
  it('creates order with snapshots and computed totals', async () => {
    const model = makeOrderModel();
    const productsService: any = {
      getById: jest.fn().mockResolvedValue({
        id: '507f1f77bcf86cd799439011',
        sku: 'SKU-1',
        name: 'Prod',
        price: 10,
      }),
    };
    model.create.mockResolvedValue({
      _id: '1',
      invoiceNumber: 'INV-1',
      clientName: 'Acme',
      total: 20,
      items: [
        { productId: 'p1', sku: 'SKU-1', name: 'Prod', unitPrice: 10, quantity: 2, lineTotal: 20 },
      ],
    });

    const service = new OrdersService(model as any, productsService);
    const result = await service.createOrder({
      invoiceNumber: 'INV-1',
      clientName: 'Acme',
      items: [{ productId: '507f1f77bcf86cd799439011', quantity: 2 }],
    });

    expect(result.total).toBe(20);
    expect(result.invoiceNumber).toBe('INV-1');
    expect(productsService.getById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });

  it('lists orders with filters, sorting, and pagination', async () => {
    const model = makeOrderModel();
    const productsService: any = { getById: jest.fn() };
    const service = new OrdersService(model as any, productsService);
    await service.listOrders({
      page: 2,
      limit: 5,
      sortBy: 'total',
      sortDir: 'desc',
      clientContains: 'ac',
      invoiceNumber: 'INV-1',
    } as any);

    const meta = (model as any).__getLast();
    expect(meta.lastFilter).toEqual({
      clientName: { $regex: 'ac', $options: 'i' },
      invoiceNumber: 'INV-1',
    });
    expect(meta.lastSort).toEqual({ total: -1 });
    expect(meta.lastSkip).toBe(5);
    expect(meta.lastLimit).toBe(5);
  });

  it('gets order by id', async () => {
    const model = makeOrderModel();
    const productsService: any = { getById: jest.fn() };
    model.findById.mockReturnValue({
      exec: () => ({
        _id: '1',
        clientName: 'Acme',
        total: 20,
        items: [
          { productId: 'p1', sku: 'SKU-1', name: 'Prod', unitPrice: 10, quantity: 2, lineTotal: 20 },
        ],
      }),
    });

    const service = new OrdersService(model as any, productsService);
    const result = await service.getById('1');
    expect(result.clientName).toBe('Acme');
  });

  it('updates order and recalculates totals when items are provided', async () => {
    const model = makeOrderModel();
    const productsService: any = {
      getById: jest.fn().mockResolvedValue({
        id: '507f1f77bcf86cd799439011',
        sku: 'SKU-1',
        name: 'Prod',
        price: 10,
      }),
    };
    model.findById.mockReturnValue({ exec: () => ({ _id: '1' }) });
    model.findByIdAndUpdate.mockResolvedValue({
      _id: '1',
      clientName: 'Acme',
      total: 20,
      items: [
        { productId: 'p1', sku: 'SKU-1', name: 'Prod', unitPrice: 10, quantity: 2, lineTotal: 20 },
      ],
    });

    const service = new OrdersService(model as any, productsService);
    const result = await service.updateById('1', {
      items: [{ productId: '507f1f77bcf86cd799439011', quantity: 2 }],
    });
    expect(result.total).toBe(20);
  });

  it('gets total sold in last month', async () => {
    const model = makeOrderModel();
    const productsService: any = { getById: jest.fn() };
    model.aggregate = jest.fn().mockReturnValue({
      exec: () => [{ total: 150 }],
    });

    const service = new OrdersService(model as any, productsService);
    const total = await service.getTotalSoldLastMonth();
    expect(total).toBe(150);
  });

  it('gets highest total order', async () => {
    const model = makeOrderModel();
    const productsService: any = { getById: jest.fn() };
    model.findOne = jest.fn().mockReturnValue({
      sort: () => ({
        exec: () => ({
          _id: '1',
          clientName: 'Acme',
          total: 200,
          items: [
            { productId: 'p1', sku: 'SKU-1', name: 'Prod', unitPrice: 10, quantity: 2, lineTotal: 20 },
          ],
        }),
      }),
    });

    const service = new OrdersService(model as any, productsService);
    const order = await service.getHighestTotalOrder();
    expect(order?.total).toBe(200);
  });
});
