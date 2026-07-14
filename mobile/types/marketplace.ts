export type TabKey = 'Inicio' | 'Vender' | 'Pedidos' | 'Cuenta';

export type ProductComment = {
  id: string;
  author: string;
  rating: number;
  text: string;
};

export type Product = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  available: boolean;
  seller: string;
  imageUrl: string | null;
  visualTone: 'light' | 'dark' | 'cool' | 'warm';
};

export type CartItem = {
  id?: string;
  product: Product;
  quantity: number;
};

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type OrderItem = {
  id: string;
  productName: string;
  storeName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  currency: string;
  subtotal: number;
  shipping: number;
  total: number;
  itemCount: number;
  createdAt: string | null;
  items: OrderItem[];
};

export type CartSummary = {
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  itemCount: number;
};

export type Tone = 'default' | 'success' | 'warning';
