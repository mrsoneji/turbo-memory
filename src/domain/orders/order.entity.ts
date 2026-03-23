export class OrderItemSnapshotEntity {
  productId: string;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export class OrderEntity {
  id: string;
  invoiceNumber?: string;
  clientName: string;
  total: number;
  items: OrderItemSnapshotEntity[];
}
