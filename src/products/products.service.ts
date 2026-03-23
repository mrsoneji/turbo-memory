import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './product.schema';
import { CreateProduct } from '../domain/products/create-product.entity';
import { UpdateProduct } from '../domain/products/update-product.entity';
import { ProductEntity } from '../domain/products/product.entity';
import { SearchProductsDto, SortDirection } from '../transport/http/products/search-products.dto';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private readonly productModel: Model<ProductDocument>) {}

  async createProduct(input: CreateProduct): Promise<ProductEntity> {
    const existing = await this.productModel.findOne({ sku: input.sku }).exec();
    if (existing) {
      throw new ConflictException('SKU already exists');
    }
    const created = await this.productModel.create({
      name: input.name,
      sku: input.sku,
      pictureUrl: input.pictureUrl,
      price: input.price,
    });
    return this.toEntity(created);
  }

  async listProducts(query?: SearchProductsDto): Promise<ProductEntity[]> {
    const filter: Record<string, unknown> = {};
    if (query?.name) {
      filter.name = query.name;
    } else if (query?.nameContains) {
      filter.name = { $regex: query.nameContains, $options: 'i' };
    }
    if (query?.sku) {
      filter.sku = query.sku;
    }
    if (query?.price !== undefined) {
      filter.price = query.price;
    } else if (query?.minPrice !== undefined || query?.maxPrice !== undefined) {
      filter.price = {
        ...(query.minPrice !== undefined ? { $gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { $lte: query.maxPrice } : {}),
      };
    }

    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const sortBy = query?.sortBy ?? 'createdAt';
    const sortDir = query?.sortDir ?? SortDirection.Asc;
    const sortOrder = sortDir === SortDirection.Desc ? -1 : 1;

    const docs = await this.productModel
      .find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    return docs.map((doc) => this.toEntity(doc));
  }

  async getById(id: string): Promise<ProductEntity> {
    const doc = await this.productModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Product not found');
    }
    return this.toEntity(doc);
  }

  async updateById(id: string, input: UpdateProduct): Promise<ProductEntity> {
    const existing = await this.productModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException('Product not found');
    }
    if (input.sku) {
      const conflict = await this.productModel
        .findOne({ sku: input.sku, _id: { $ne: existing._id } })
        .exec();
      if (conflict) {
        throw new ConflictException('SKU already exists');
      }
    }

    const updated = await this.productModel.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.sku !== undefined ? { sku: input.sku } : {}),
          ...(input.pictureUrl !== undefined ? { pictureUrl: input.pictureUrl } : {}),
          ...(input.price !== undefined ? { price: input.price } : {}),
        },
      },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('Product not found');
    }
    return this.toEntity(updated);
  }

  async deleteById(id: string): Promise<void> {
    const res = await this.productModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException('Product not found');
    }
  }

  toEntity(doc: ProductDocument): ProductEntity {
    return {
      id: doc._id.toString(),
      name: doc.name,
      sku: doc.sku,
      pictureUrl: doc.pictureUrl,
      price: doc.price,
    };
  }
}
