export class CreateOrderItem {
  productId: string;
  quantity: number;
}

export class CreateOrder {
  clientName: string;
  items: CreateOrderItem[];
}
