
import { Product, Promotion } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'CONTRA FILÉ GRILL', price: 49.90, unit: 'KG' },
  { id: '2', name: 'PICANHA ARGENTINA', price: 89.90, unit: 'KG' },
  { id: '3', name: 'FRALDINHA ESPECIAL', price: 35.90, unit: 'KG' }
];

export const INITIAL_PROMOTIONS: Promotion[] = [
  {
    id: 'p1',
    productId: '2',
    offerPrice: 79.90,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    description: 'A MELHOR PICANHA PARA O SEU CHURRASCO!',
    isActive: true
  }
];
