
export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  category?: string;
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
  productIds: string[];
  discountPrices: Record<string, number>;
  isActive: boolean;
}

export interface AppState {
  storeName: string;
  products: Product[];
  promotions: Promotion[];
  superOffer: SuperOffer;
  view: 'ADMIN' | 'TV';
  tvOrientation: 0 | 90;
  promoInterval: number;
}
