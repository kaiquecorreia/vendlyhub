import { Category, CategoryFormData } from '../types/product';
import { apiClient } from './apiClient';

interface ApiCategory {
  id: string;
  establishmentId: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

const toCategory = (category: ApiCategory): Category => ({
  id: category.id,
  companyId: category.establishmentId,
  name: category.name,
  description: category.description,
  status: category.status,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
});

export const categoryService = {
  async listCategories(): Promise<Category[]> {
    const response = await apiClient.get<ApiCategory[]>('/categories');
    return response.data.map(toCategory);
  },

  async createCategory(data: CategoryFormData): Promise<Category> {
    const response = await apiClient.post<ApiCategory>('/categories', data);
    return toCategory(response.data);
  },

  async updateCategory(id: string, data: CategoryFormData): Promise<Category> {
    const response = await apiClient.patch<ApiCategory>(`/categories/${id}`, data);
    return toCategory(response.data);
  },

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  },
};
