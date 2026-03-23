import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ _id: false })
export class OrderItemSnapshot {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  productId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  sku: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  lineTotal: number;
}

const OrderItemSnapshotSchema = SchemaFactory.createForClass(OrderItemSnapshot);

@Schema({ timestamps: true })
export class Order {
  @Prop({ trim: true, unique: true, sparse: true })
  invoiceNumber?: string;

  @Prop({ required: true, trim: true })
  clientName: string;

  @Prop({ required: true, min: 0 })
  total: number;

  @Prop({ type: [OrderItemSnapshotSchema], required: true })
  items: OrderItemSnapshot[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ clientName: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ invoiceNumber: 1 }, { unique: true, sparse: true });
