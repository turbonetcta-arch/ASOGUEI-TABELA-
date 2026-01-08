
import { Product, Promotion } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'PICANHA ARGENTINA', price: 98.90, unit: 'KG', category: 'Bovino' },
  { id: '2', name: 'CONTRA FILÉ GRILL', price: 54.90, unit: 'KG', category: 'Bovino' },
  { id: '3', name: 'ALCATRA ESPECIAL', price: 46.90, unit: 'KG', category: 'Bovino' },
  { id: '4', name: 'COXÃO MOLE', price: 39.90, unit: 'KG', category: 'Bovino' },
  { id: '5', name: 'PATINHO EXTRA', price: 38.50, unit: 'KG', category: 'Bovino' },
  { id: '6', name: 'ACÉM DO CHEF', price: 31.90, unit: 'KG', category: 'Bovino' },
  { id: '7', name: 'MÚSCULO TRASEIRO', price: 28.90, unit: 'KG', category: 'Bovino' },
  { id: '8', name: 'COSTELA DE CHÃO', price: 22.90, unit: 'KG', category: 'Bovino' },
  { id: '9', name: 'FRALDINHA MACIA', price: 42.90, unit: 'KG', category: 'Bovino' },
  { id: '10', name: 'FILET MIGNON', price: 74.90, unit: 'KG', category: 'Bovino' },
  { id: '11', name: 'LINGUIÇA ARTESANAL', price: 24.90, unit: 'KG', category: 'Suíno' },
  { id: '12', name: 'SOBRECOXA DESOSSADA', price: 18.90, unit: 'KG', category: 'Aves' },
];

export const INITIAL_PROMOTIONS: Promotion[] = [
  {
    id: 'p1',
    productId: '1',
    offerPrice: 89.90,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop',
    description: 'A VERDADEIRA PICANHA COM PREÇO DE OCASIÃO!',
    isActive: true
  },
  {
    id: 'p2',
    productId: '8',
    offerPrice: 19.90,
    imageUrl: 'https://images.unsplash.com/photo-1593030103066-009da314efde?w=800&auto=format&fit=crop',
    description: 'COSTELA JANELÃO - O MELHOR PREÇO DA REGIÃO',
    isActive: true
  },
  {
    id: 'p3',
    productId: '11',
    offerPrice: 17.90,
    imageUrl: 'https://images.unsplash.com/photo-1547050605-2f22896504a7?w=800&auto=format&fit=crop',
    description: 'LINGUIÇA TOSCANA PARA SEU CHURRASCO FICAR COMPLETO',
    isActive: true
  }
];
