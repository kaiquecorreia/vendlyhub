import { Category, Product } from './product';

export interface Company {
  id: string;
  slug: string;
  name: string;
  logo?: string;
  whatsapp: string;
  pixCopyPaste?: string;
  address?: string;
}

export interface CatalogProduct extends Product {
  isHighlighted?: boolean;
  availableStock: number;
}

export interface CatalogCategory extends Category {
  products: CatalogProduct[];
}

export interface CartItem {
  product: CatalogProduct;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface OrderFormData {
  customerName: string;
  whatsapp: string;
  address: string;
}

export interface Order {
  id: string;
  companyId: string;
  customer: OrderFormData;
  items: CartItem[];
  total: number;
  createdAt: string;
}

export interface CatalogFilters {
  search: string;
  categoryId: string;
  availableOnly: boolean;
  promotionOnly: boolean;
}

export const DEFAULT_FILTERS: CatalogFilters = {
  search: '',
  categoryId: '',
  availableOnly: false,
  promotionOnly: false,
};
