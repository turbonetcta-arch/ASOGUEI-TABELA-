
export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: string;
}

export interface Promotion {
  id: string;
  productId: string;
  offerPrice: number;
  imageUrl: string;
  description: string;
  isActive: boolean;
}

export interface SuperOffer {
  productId: string;
  discountPrice: number;
  isActive: boolean;
}

export type AppMode = 'ADMIN' | 'TV' | 'CONTROLLER';

export interface AppState {
  products: Product[];
  promotions: Promotion[];
  superOffer: SuperOffer;
  storeName: string;
  accentColor: string;
  promoInterval: number;
  productPageInterval: number;
  tvOrientation: 0 | 90; // 0 para Horizontal, 90 para Vertical
}
