export type TabKey = 'Inicio' | 'Vender' | 'Cuenta';

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
  ownerProfileId: string | null;
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

export type ItemFulfillmentStatus =
  | 'pending'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type OrderItem = {
  id: string;
  productName: string;
  storeName: string;
  unitPrice: number;
  quantity: number;
  fulfillmentStatus: ItemFulfillmentStatus;
  subtotal: number;
};

export type Sale = {
  id: string;
  orderId: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  subtotal: number;
  currency: string;
  fulfillmentStatus: ItemFulfillmentStatus;
  nextStatus: ItemFulfillmentStatus | null;
  buyerName: string | null;
  createdAt: string | null;
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

export type NotificationType = 'sale' | 'payment_confirmed' | 'order_status' | 'cart_stock';

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string | null;
};

export type Tone = 'default' | 'success' | 'warning';
