import type { Order, Product } from '../types/marketplace';

export const products: Product[] = [
  {
    id: 'P-100',
    title: 'Audifonos inalambricos Nexo Aire',
    description:
      'Audifonos inalambricos compactos con cancelacion pasiva, estuche de carga y autonomia para uso diario en clases, trabajo o viajes cortos.',
    category: 'Tecnologia',
    price: 49.99,
    shipping: 'Gratis',
    stock: 15,
    available: true,
    rating: 4.8,
    seller: 'TechHub EC',
    condition: 'Nuevo',
    visualTone: 'dark',
    comments: [
      { id: 'C-100-1', author: 'Majo', rating: 5, text: 'Buen sonido y llegaron antes de lo esperado.' },
      { id: 'C-100-2', author: 'Diego', rating: 4, text: 'La bateria rinde bien para todo el dia.' },
    ],
  },
  {
    id: 'P-101',
    title: 'Chaqueta amplia urbana',
    description:
      'Chaqueta ligera de corte amplio, pensada para atuendos urbanos y capas de clima templado. Tela suave y bolsillos frontales.',
    category: 'Moda',
    price: 34.5,
    shipping: 'Rapido',
    stock: 21,
    available: true,
    rating: 4.6,
    seller: 'StreetSeven',
    condition: 'Nuevo',
    visualTone: 'cool',
    comments: [
      { id: 'C-101-1', author: 'Vale', rating: 5, text: 'El corte queda muy bien y se siente comodo.' },
    ],
  },
  {
    id: 'P-102',
    title: 'Organizador modular para escritorio',
    description:
      'Set modular para ordenar cables, libretas y accesorios pequenos. Ideal para oficina en casa, estudio o espacio de juegos minimalista.',
    category: 'Hogar',
    price: 18.75,
    shipping: 'Coordinado',
    stock: 9,
    available: true,
    rating: 4.4,
    seller: 'CasaLab',
    condition: 'Nuevo',
    visualTone: 'light',
    comments: [
      { id: 'C-102-1', author: 'Andres', rating: 4, text: 'Me ayudo a liberar espacio en el escritorio.' },
    ],
  },
  {
    id: 'P-103',
    title: 'Set de cuidado facial esencial',
    description:
      'Rutina basica con limpiador, hidratante y protector diario. Recomendado para iniciar cuidado facial sin pasos complicados.',
    category: 'Belleza',
    price: 27.25,
    shipping: 'Gratis',
    stock: 30,
    available: true,
    rating: 4.9,
    seller: 'GlowMarket',
    condition: 'Nuevo',
    visualTone: 'warm',
    comments: [
      { id: 'C-103-1', author: 'Sofi', rating: 5, text: 'Producto suave, no me irrito y huele muy bien.' },
      { id: 'C-103-2', author: 'Camila', rating: 5, text: 'Buena relacion precio-calidad.' },
    ],
  },
];

export const orders: Order[] = [
  { id: 'ORD-845', title: 'Audifonos inalambricos Nexo Aire', status: 'En camino', eta: 'Llega manana' },
  { id: 'ORD-812', title: 'Chaqueta amplia urbana', status: 'Empacado', eta: 'Sale hoy' },
];
