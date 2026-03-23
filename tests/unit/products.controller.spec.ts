import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { ProductsController } from '../../src/products/products.controller';
import { ProductsService } from '../../src/products/products.service';
import { CreateProductDto } from '../../src/transport/http/products/create-product.dto';
import { UpdateProductDto } from '../../src/transport/http/products/update-product.dto';

jest.mock('sharp', () =>
  jest.fn(() => ({
    metadata: jest.fn().mockResolvedValue({ width: 100, height: 100 }),
  })),
);

const makeProductsService = () => ({
  listProducts: jest.fn(),
  getById: jest.fn(),
  createProduct: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn(),
});

describe('ProductsController', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true });

  it('validates CreateProductDto price minimum', async () => {
    await expect(
      pipe.transform(
        { name: 'A', sku: 'SKU', price: -1, picture: 'x' },
        { type: 'body', metatype: CreateProductDto },
      ),
    ).rejects.toBeTruthy();
  });

  it('validates CreateProductDto required name', async () => {
    await expect(
      pipe.transform(
        { name: '', sku: 'SKU', price: 10, picture: 'x' },
        { type: 'body', metatype: CreateProductDto },
      ),
    ).rejects.toBeTruthy();
  });

  it('validates UpdateProductDto price minimum', async () => {
    await expect(
      pipe.transform({ price: -10 }, { type: 'body', metatype: UpdateProductDto }),
    ).rejects.toBeTruthy();
  });

  it('calls listProducts', async () => {
    const productsService = makeProductsService();
    productsService.listProducts.mockResolvedValue([]);

    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: productsService }],
    }).compile();

    const controller = moduleRef.get(ProductsController);
    await controller.list({ page: 2, limit: 5, sortBy: 'name', sortDir: 'asc', nameContains: 'ab' } as any);
    expect(productsService.listProducts).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
      sortBy: 'name',
      sortDir: 'asc',
      nameContains: 'ab',
    });
  });

  it('calls getById', async () => {
    const productsService = makeProductsService();
    productsService.getById.mockResolvedValue({ id: '1', sku: 'SKU-1' });

    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: productsService }],
    }).compile();

    const controller = moduleRef.get(ProductsController);
    await controller.getById('1');
    expect(productsService.getById).toHaveBeenCalledWith('1');
  });

  it('creates product with picture url', async () => {
    const productsService = makeProductsService();
    productsService.createProduct.mockResolvedValue({ id: '1' });

    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: productsService }],
    }).compile();

    const controller = moduleRef.get(ProductsController);
    await controller.create(
      { name: 'A', sku: 'SKU-1', price: 10, picture: 'x' } as CreateProductDto,
      { buffer: Buffer.from('fake') },
    );

    expect(productsService.createProduct).toHaveBeenCalledWith({
      name: 'A',
      sku: 'SKU-1',
      pictureUrl: 's3.amazonaws.com/bucket/product_SKU-1',
      price: 10,
    });
  });

  it('updates product with new picture url', async () => {
    const productsService = makeProductsService();
    productsService.getById.mockResolvedValue({ id: '1', sku: 'SKU-1' });
    productsService.updateById.mockResolvedValue({ id: '1' });

    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: productsService }],
    }).compile();

    const controller = moduleRef.get(ProductsController);
    await controller.update(
      '1',
      { name: 'B', price: 20 } as UpdateProductDto,
      { buffer: Buffer.from('fake') },
    );

    expect(productsService.updateById).toHaveBeenCalledWith('1', {
      name: 'B',
      pictureUrl: 's3.amazonaws.com/bucket/product_SKU-1',
      price: 20,
    });
  });

  it('updates product and allows SKU change', async () => {
    const productsService = makeProductsService();
    productsService.updateById.mockResolvedValue({ id: '1' });

    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: productsService }],
    }).compile();

    const controller = moduleRef.get(ProductsController);
    await controller.update(
      '1',
      { sku: 'SKU-NEW', price: 20 } as UpdateProductDto,
      undefined,
    );

    expect(productsService.updateById).toHaveBeenCalledWith('1', {
      name: undefined,
      sku: 'SKU-NEW',
      pictureUrl: 's3.amazonaws.com/bucket/product_SKU-NEW',
      price: 20,
    });
  });
});
