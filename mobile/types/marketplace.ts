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
  condition: 'Nuevo' | 'Usado';
  visualTone: 'light' | 'dark' | 'cool' | 'warm';
};

export type CartItem = {
  id?: string;
  product: Product;
  quantity: number;
};

export type Order = {
  id: string;
  title: string;
  status: 'Pagado' | 'Empacado' | 'En camino' | 'Entregado';
  eta: string;
};

export type Tone = 'default' | 'success' | 'warning';
