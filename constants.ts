
import { Product, Promotion } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'CORAÇÃO BOVINO', price: 13.49, unit: 'KG', category: 'Bovino' },
  { id: '2', name: 'BISTECA SUÍNA', price: 18.99, unit: 'KG', category: 'Suíno' },
  { id: '3', name: 'COSTELA SUÍNA', price: 21.99, unit: 'KG', category: 'Suíno' },
  { id: '4', name: 'SALSICHA FREDDO', price: 8.99, unit: 'KG', category: 'Embutidos' },
  { id: '5', name: 'TOSCANA SUÍNA', price: 21.99, unit: 'KG', category: 'Suíno' },
  { id: '6', name: 'OSSADA BOVINA', price: 8.99, unit: 'KG', category: 'Bovino' },
  { id: '7', name: 'CARNE COM OSSO', price: 24.29, unit: 'KG', category: 'Bovino' },
  { id: '8', name: 'PÉ DE PORCO', price: 11.99, unit: 'KG', category: 'Suíno' },
  { id: '9', name: 'CALABRESA SEARA', price: 31.49, unit: 'KG', category: 'Embutidos' },
  { id: '10', name: 'CALABRESA FRIMESA', price: 25.50, unit: 'KG', category: 'Embutidos' },
  { id: '11', name: 'CALABRESA ESTRELA', price: 25.50, unit: 'KG', category: 'Embutidos' },
  { id: '12', name: 'CALABRESA AURORA', price: 27.99, unit: 'KG', category: 'Embutidos' },
  { id: '13', name: 'CALABRESA PERDIGÃO', price: 34.99, unit: 'KG', category: 'Embutidos' },
  { id: '14', name: 'SALSICHA PERDIGÃO', price: 15.70, unit: 'KG', category: 'Embutidos' },
  { id: '15', name: 'SALSICHA SEARA', price: 14.99, unit: 'KG', category: 'Embutidos' },
  { id: '16', name: 'SALSICHA LEBOM', price: 11.49, unit: 'KG', category: 'Embutidos' },
  { id: '17', name: 'TOSCANA FRIMESA', price: 21.99, unit: 'Embutidos', category: 'Embutidos' },
  { id: '18', name: 'TOUCINHO', price: 24.00, unit: 'KG', category: 'Suíno' },
  { id: '19', name: 'KIT FEIJOADA', price: 26.00, unit: 'UN', category: 'Suíno' },
  { id: '20', name: 'TOSCANA APIMENTADA', price: 25.99, unit: 'KG', category: 'Embutidos' },
  { id: '21', name: 'LOMBO SUÍNO', price: 30.00, unit: 'KG', category: 'Suíno' },
  { id: '22', name: 'COXA E SOBRECOXA', price: 13.49, unit: 'KG', category: 'Aves' },
  { id: '23', name: 'FILÉ DE PEITO', price: 24.30, unit: 'KG', category: 'Aves' },
  { id: '24', name: 'FÍGADO BOVINO', price: 18.49, unit: 'KG', category: 'Bovino' },
  { id: '25', name: 'PICANHA CONGELADA FRIBOI', price: 89.60, unit: 'KG', category: 'Bovino' },
  { id: '26', name: 'OSSADA DA ALCATRA', price: 21.99, unit: 'KG', category: 'Bovino' },
  { id: '27', name: 'TULIPA', price: 30.99, unit: 'KG', category: 'Aves' },
  { id: '28', name: 'CHAMBARIL', price: 21.79, unit: 'KG', category: 'Bovino' },
  { id: '29', name: 'COXINHA DA ASA', price: 19.99, unit: 'KG', category: 'Aves' },
  { id: '30', name: 'COXINHA ASA TEMPERADA', price: 25.99, unit: 'KG', category: 'Aves' },
  { id: '31', name: 'CARNE DE SOL', price: 49.99, unit: 'KG', category: 'Bovino' },
  { id: '32', name: 'BIFE LIGHT', price: 49.90, unit: 'KG', category: 'Bovino' },
  { id: '33', name: 'COXÃO MOLE FRIBOI', price: 45.00, unit: 'KG', category: 'Bovino' },
  { id: '34', name: 'COXÃO DURO FRIBOI', price: 36.50, unit: 'KG', category: 'Bovino' },
  { id: '35', name: 'CARNE MACIÇA', price: 28.39, unit: 'KG', category: 'Bovino' },
];

export const INITIAL_PROMOTIONS: Promotion[] = [
  {
    id: 'p1',
    productId: '25',
    offerPrice: 79.90,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop',
    description: 'PICANHA FRIBOI: A NOBREZA NO SEU CHURRASCO!',
    isActive: true
  },
  {
    id: 'p2',
    productId: '31',
    offerPrice: 44.99,
    imageUrl: 'https://images.unsplash.com/photo-1593030103066-009da314efde?w=800&auto=format&fit=crop',
    description: 'CARNE DE SOL ARTESANAL - SABOR DO SERTÃO',
    isActive: true
  },
  {
    id: 'p3',
    productId: '29',
    offerPrice: 17.90,
    imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&auto=format&fit=crop',
    description: 'COXINHA DA ASA: O PETISCO PERFEITO!',
    isActive: true
  }
];
