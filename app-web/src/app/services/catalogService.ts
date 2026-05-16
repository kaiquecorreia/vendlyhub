import { CatalogCategory, CatalogProduct, Company } from '../types/catalog';
import { apiClient } from './apiClient';
import { getValidMobileSlug } from '../lib/mobileSlug';

interface ApiCatalogResponse {
  company: Company;
  categories: CatalogCategory[];
}

export const catalogService = {
  async getCatalogBySlug(slug: string): Promise<ApiCatalogResponse> {
    const normalizedSlug = getValidMobileSlug(slug);
    if (!normalizedSlug) {
      throw new Error('Slug de catálogo inválido');
    }
    const response = await apiClient.get<ApiCatalogResponse>(`/catalog/${normalizedSlug}`);
    return response.data;
  },

  async getHighlightedProducts(slug: string): Promise<CatalogProduct[]> {
    const normalizedSlug = getValidMobileSlug(slug);
    if (!normalizedSlug) {
      throw new Error('Slug de catálogo inválido');
    }
    const response = await apiClient.get<CatalogProduct[]>(
      `/catalog/${normalizedSlug}/highlighted`,
    );
    return response.data;
  },
};
