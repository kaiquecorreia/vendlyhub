export interface Category {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CategoryFormData {
  name: string;
  description?: string;
  status: 'active' | 'inactive';
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  sku: string;
  categoryId: string;
  categoryName?: string;
  brand: string;
  model: string;
  description: string;
  salePrice: number;
  discount: number;
  cost: number;
  margin: number;
  unit: string;
  stockQuantity: number;
  reservedStock: number;
  soldQuantity: number;
  minStock: number;
  supplier: string;
  supplierCode: string;
  ean: string;
  status: 'active' | 'inactive';
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  name: string;
  sku: string;
  categoryId: string;
  brand: string;
  model: string;
  description: string;
  salePrice: number;
  discount: number;
  cost: number;
  unit: string;
  stockQuantity: number;
  reservedStock: number;
  soldQuantity: number;
  minStock: number;
  supplier: string;
  supplierCode?: string;
  ean?: string;
  status: 'active' | 'inactive';
  image?: File | null;
  imageUrl?: string;
}

export const UNITS = ['Unidade', 'Caixa', 'Pacote', 'Kg', 'Litro', 'Metro', 'M²', 'M³'] as const;

export type Unit = (typeof UNITS)[number];
