export interface Product {
  id: string;
  name: string;
  description: string;
  price_ngn: number;
  sort_order: number;
  active: boolean;
}

export interface CartItem {
  product_id: string;
  name: string;
  unit_price_ngn: number;
  quantity: number;
}
