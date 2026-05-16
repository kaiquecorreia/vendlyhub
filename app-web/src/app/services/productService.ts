import type { PendingProductDraft } from '../lib/pendingProductDraft';
import {
  pendingDraftToMinimalFormData,
  pendingDraftToMinimalFormDataList,
} from '../lib/pendingProductDraft';
import { Product, ProductFormData } from '../types/product';
import { apiClient } from './apiClient';

interface ApiProduct {
  id: string;
  establishmentId: string;
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
  supplierCode?: string;
  ean?: string;
  status: 'active' | 'inactive';
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

const toProduct = (product: ApiProduct): Product => ({
  id: product.id,
  companyId: product.establishmentId,
  name: product.name,
  sku: product.sku,
  categoryId: product.categoryId,
  categoryName: product.categoryName,
  brand: product.brand,
  model: product.model,
  description: product.description,
  salePrice: Number(product.salePrice),
  discount: Number(product.discount),
  cost: Number(product.cost),
  margin: Number(product.margin),
  unit: product.unit,
  stockQuantity: product.stockQuantity,
  reservedStock: product.reservedStock,
  soldQuantity: product.soldQuantity,
  minStock: product.minStock,
  supplier: product.supplier,
  supplierCode: product.supplierCode || '',
  ean: product.ean || '',
  status: product.status,
  imageUrl: product.imageUrl,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

const appendIfNonEmpty = (formData: FormData, key: string, value: string | undefined) => {
  const t = value?.trim();
  if (t) formData.append(key, t);
};

/** Create payload: omit blank optional fields so the API applies defaults (e.g. category). */
const toCreateMultipartFormData = (data: ProductFormData) => {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('salePrice', String(data.salePrice));
  formData.append('discount', String(data.discount ?? 0));
  formData.append('cost', String(data.cost));
  formData.append('stockQuantity', String(data.stockQuantity));
  formData.append('reservedStock', String(data.reservedStock ?? 0));
  formData.append('soldQuantity', String(data.soldQuantity ?? 0));
  formData.append('minStock', String(data.minStock));
  formData.append('status', data.status);
  appendIfNonEmpty(formData, 'sku', data.sku);
  appendIfNonEmpty(formData, 'categoryId', data.categoryId);
  formData.append('brand', data.brand ?? '');
  formData.append('model', data.model ?? '');
  formData.append('description', data.description ?? '');
  formData.append('unit', data.unit ?? '');
  formData.append('supplier', data.supplier ?? '');
  if (data.supplierCode) formData.append('supplierCode', data.supplierCode);
  if (data.ean) formData.append('ean', data.ean);
  if (data.image instanceof File) {
    formData.append('image', data.image);
  }
  return formData;
};

const toMultipartFormData = (data: ProductFormData) => {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('sku', data.sku);
  formData.append('categoryId', data.categoryId);
  formData.append('brand', data.brand);
  formData.append('model', data.model);
  formData.append('description', data.description);
  formData.append('salePrice', String(data.salePrice));
  formData.append('discount', String(data.discount ?? 0));
  formData.append('cost', String(data.cost));
  formData.append('unit', data.unit);
  formData.append('stockQuantity', String(data.stockQuantity));
  formData.append('reservedStock', String(data.reservedStock ?? 0));
  formData.append('soldQuantity', String(data.soldQuantity ?? 0));
  formData.append('minStock', String(data.minStock));
  formData.append('supplier', data.supplier);
  if (data.supplierCode) formData.append('supplierCode', data.supplierCode);
  if (data.ean) formData.append('ean', data.ean);
  formData.append('status', data.status);
  if (data.image instanceof File) {
    formData.append('image', data.image);
  }
  return formData;
};

export const productService = {
  async listProducts(): Promise<Product[]> {
    const response = await apiClient.get<ApiProduct[]>('/products');
    return response.data.map(toProduct);
  },

  async createProduct(data: ProductFormData): Promise<Product> {
    const response = await apiClient.post<ApiProduct>(
      '/products',
      toCreateMultipartFormData(data),
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return toProduct(response.data);
  },

  async createProductFromPendingDraft(draft: PendingProductDraft): Promise<Product> {
    const data = pendingDraftToMinimalFormData(draft);
    const response = await apiClient.post<ApiProduct>(
      '/products',
      toCreateMultipartFormData(data),
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return toProduct(response.data);
  },

  async createProductsFromPendingDraft(draft: PendingProductDraft): Promise<Product[]> {
    const drafts = pendingDraftToMinimalFormDataList(draft);
    const created: Product[] = [];
    for (const productDraft of drafts) {
      const response = await apiClient.post<ApiProduct>(
        '/products',
        toCreateMultipartFormData(productDraft),
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      created.push(toProduct(response.data));
    }
    return created;
  },

  async updateProduct(id: string, data: ProductFormData): Promise<Product> {
    const response = await apiClient.patch<ApiProduct>(
      `/products/${id}`,
      toMultipartFormData(data),
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return toProduct(response.data);
  },

  async updateProductStock(id: string, stockQuantity: number): Promise<Product> {
    const formData = new FormData();
    formData.append('stockQuantity', String(stockQuantity));
    const response = await apiClient.patch<ApiProduct>(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return toProduct(response.data);
  },

  async updateProductImage(id: string, image: File): Promise<Product> {
    const formData = new FormData();
    formData.append('image', image);
    const response = await apiClient.patch<ApiProduct>(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return toProduct(response.data);
  },

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },
};
