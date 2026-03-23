export class UpdateOrderItem {
  productId: string;
  quantity: number;
}

export class UpdateOrder {
  invoiceNumber?: string;
  clientName?: string;
  items?: UpdateOrderItem[];
}
