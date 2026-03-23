import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './order.schema';
import { CreateOrder } from '../domain/orders/create-order.entity';
import { UpdateOrder } from '../domain/orders/update-order.entity';
import { OrderEntity, OrderItemSnapshotEntity } from '../domain/orders/order.entity';
import { ProductsService } from '../products/products.service';
import { SearchOrdersDto, OrderSortDirection } from '../transport/http/orders/search-orders.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly productsService: ProductsService,
  ) {}

  async createOrder(input: CreateOrder): Promise<OrderEntity> {
    const items = await this.buildSnapshots(input.items);
    const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const created = await this.orderModel.create({
      clientName: input.clientName,
      total,
      items: items.map((item) => ({
        productId: new Types.ObjectId(item.productId),
        sku: item.sku,
        name: item.name,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
    });
    return this.toEntity(created);
  }

  async listOrders(query?: SearchOrdersDto): Promise<OrderEntity[]> {
    const filter: Record<string, unknown> = {};
    if (query?.clientName) {
      filter.clientName = query.clientName;
    } else if (query?.clientContains) {
      filter.clientName = { $regex: query.clientContains, $options: 'i' };
    }

    const page = query?.page ?? 1;
    const limit = Math.min(query?.limit ?? 20, 100);
    const sortBy = query?.sortBy ?? 'createdAt';
    const sortDir = query?.sortDir ?? OrderSortDirection.Asc;
    const sortOrder = sortDir === OrderSortDirection.Desc ? -1 : 1;

    const docs = await this.orderModel
      .find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    return docs.map((doc) => this.toEntity(doc));
  }

  async getById(id: string): Promise<OrderEntity> {
    const doc = await this.orderModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Order not found');
    }
    return this.toEntity(doc);
  }

  async updateById(id: string, input: UpdateOrder): Promise<OrderEntity> {
    const existing = await this.orderModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException('Order not found');
    }

    let itemsSnapshot: OrderItemSnapshotEntity[] | undefined;
    let total: number | undefined;
    if (input.items) {
      itemsSnapshot = await this.buildSnapshots(input.items);
      total = itemsSnapshot.reduce((sum, item) => sum + item.lineTotal, 0);
    }

    const updated = await this.orderModel.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(input.clientName !== undefined ? { clientName: input.clientName } : {}),
          ...(itemsSnapshot ? { items: itemsSnapshot.map((item) => ({
            productId: new Types.ObjectId(item.productId),
            sku: item.sku,
            name: item.name,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
          })) } : {}),
          ...(total !== undefined ? { total } : {}),
        },
      },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('Order not found');
    }
    return this.toEntity(updated);
  }

  async getTotalSoldLastMonth(): Promise<number> {
    const now = new Date();
    const lastMonth = new Date(now);
    lastMonth.setMonth(now.getMonth() - 1);

    const result = await this.orderModel
      .aggregate([
        { $match: { createdAt: { $gte: lastMonth } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ])
      .exec();

    if (!result.length) {
      return 0;
    }
    return result[0].total || 0;
  }

  async getHighestTotalOrder(): Promise<OrderEntity | null> {
    const doc = await this.orderModel.findOne().sort({ total: -1, createdAt: -1 }).exec();
    if (!doc) {
      return null;
    }
    return this.toEntity(doc);
  }

  private async buildSnapshots(items: { productId: string; quantity: number }[]) {
    const snapshots = await Promise.all(
      items.map(async (item) => {
        const product = await this.productsService.getById(item.productId);
        const unitPrice = product.price;
        const lineTotal = unitPrice * item.quantity;
        return {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          unitPrice,
          quantity: item.quantity,
          lineTotal,
        };
      }),
    );
    return snapshots;
  }

  private toEntity(doc: OrderDocument): OrderEntity {
    return {
      id: doc._id.toString(),
      clientName: doc.clientName,
      total: doc.total,
      items: doc.items.map((item) => ({
        productId: item.productId.toString(),
        sku: item.sku,
        name: item.name,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
    };
  }
}
