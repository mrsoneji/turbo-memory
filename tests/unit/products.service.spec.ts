import { ProductsService } from '../../src/products/products.service';

const makeProductModel = () => {
  let lastFilter: any;
  let lastSort: any;
  let lastSkip: any;
  let lastLimit: any;
  const model: any = {
    findOne: jest.fn(),
    findById: jest.fn(),
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
                    exec: () => [{ _id: '1', name: 'P', sku: 'S', pictureUrl: 'u', price: 0 }],
                  };
                },
              };
            },
          };
        },
        exec: () => [{ _id: '1', name: 'P', sku: 'S', pictureUrl: 'u', price: 0 }],
      };
    }),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    __getLast: () => ({ lastFilter, lastSort, lastSkip, lastLimit }),
  };
  return model;
};

describe('ProductsService', () => {
  it('creates product and enforces SKU uniqueness', async () => {
    const model = makeProductModel();
    model.findOne.mockReturnValue({ exec: () => null });
    model.create.mockResolvedValue({
      _id: '1',
      name: 'Product',
      sku: 'SKU-1',
      pictureUrl: 's3.amazonaws.com/bucket/product_sku-1',
      price: 10,
    });

    const service = new ProductsService(model as any);
    const result = await service.createProduct({
      name: 'Product',
      sku: 'SKU-1',
      pictureUrl: 's3.amazonaws.com/bucket/product_sku-1',
      price: 10,
    });

    expect(result.sku).toBe('SKU-1');
  });

  it('lists products', async () => {
    const model = makeProductModel();
    const service = new ProductsService(model as any);
    const result = await service.listProducts();
    expect(result).toHaveLength(1);
  });

  it('lists products with filters, sorting, and pagination', async () => {
    const model = makeProductModel();
    const service = new ProductsService(model as any);
    await service.listProducts({
      page: 2,
      limit: 5,
      sortBy: 'price',
      sortDir: 'desc',
      nameContains: 'prod',
      minPrice: 10,
      maxPrice: 20,
      sku: 'SKU-1',
    } as any);

    const meta = (model as any).__getLast();
    expect(meta.lastFilter).toEqual({
      name: { $regex: 'prod', $options: 'i' },
      sku: 'SKU-1',
      price: { $gte: 10, $lte: 20 },
    });
    expect(meta.lastSort).toEqual({ price: -1 });
    expect(meta.lastSkip).toBe(5);
    expect(meta.lastLimit).toBe(5);
  });

  it('gets product by id', async () => {
    const model = makeProductModel();
    model.findById.mockReturnValue({ exec: () => ({ _id: '1', name: 'P', sku: 'S', pictureUrl: 'u', price: 1 }) });

    const service = new ProductsService(model as any);
    const result = await service.getById('1');
    expect(result.sku).toBe('S');
  });

  it('updates product and allows SKU change with uniqueness check', async () => {
    const model = makeProductModel();
    model.findById.mockReturnValue({ exec: () => ({ _id: '1', name: 'P', sku: 'S', pictureUrl: 'u', price: 1 }) });
    model.findOne.mockReturnValue({ exec: () => null });
    model.findByIdAndUpdate.mockResolvedValue({ _id: '1', name: 'P2', sku: 'S2', pictureUrl: 'u', price: 2 });

    const service = new ProductsService(model as any);
    const result = await service.updateById('1', { sku: 'S2', price: 2 });
    expect(result.sku).toBe('S2');
    expect(model.findOne).toHaveBeenCalled();
  });
});
