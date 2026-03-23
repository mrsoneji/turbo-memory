export class CreateOrderItem {
  productId: string;
  quantity: number;
}

export class CreateOrder {
  invoiceNumber?: string;
  clientName: string;
  items: CreateOrderItem[];
}
