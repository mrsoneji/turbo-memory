export class UpdateOrderItem {
  productId: string;
  quantity: number;
}

export class UpdateOrder {
  clientName?: string;
  items?: UpdateOrderItem[];
}
