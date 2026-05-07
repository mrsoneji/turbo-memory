export class CreateOrderItem {
  productId: string;
  quantity: number;
}

export class CreateOrder {
  createdBy: string;
  invoiceNumber?: string;
  clientName: string;
  items: CreateOrderItem[];
}
