import type { CartItem, CartSummary, Order, Product, Sale } from '../types/marketplace';

export function centsToAmount(value: number | undefined): number;
export function pickTone(id: unknown): Product['visualTone'];
export function pickPrimaryImageUrl(images: unknown): string | null;
export function mapApiProductToProduct(product: unknown): Product;
export function mapApiCartItemsToCartItems(items: unknown): CartItem[];
export function mapApiCartSummary(meta: unknown): CartSummary;
export function mapApiOrderToOrder(order: unknown): Order;
export function mapApiSale(sale: unknown): Sale;
