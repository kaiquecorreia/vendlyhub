import { CartItem, OrderFormData } from '../types/catalog';
import { ManagedOrder, OrderStatus } from '../types/order';
import { apiClient } from './apiClient';
import { getValidMobileSlug } from '../lib/mobileSlug';

interface CreateOrderPayload {
  customerName: string;
  customerWhatsapp: string;
  customerAddress: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

interface ListOrdersParams {
  status?: OrderStatus;
  limit?: number;
}

export const orderService = {
  async createOrder(slug: string, customer: OrderFormData, items: CartItem[]) {
    const normalizedSlug = getValidMobileSlug(slug);
    if (!normalizedSlug) {
      throw new Error('Slug de catálogo inválido');
    }
    const payload: CreateOrderPayload = {
      customerName: customer.customerName,
      customerWhatsapp: customer.whatsapp.replace(/\D/g, ''),
      customerAddress: customer.address,
      items: items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    };

    const response = await apiClient.post(`/catalog/${normalizedSlug}/orders`, payload);
    return response.data;
  },

  async listOrders(params?: ListOrdersParams): Promise<ManagedOrder[]> {
    const response = await apiClient.get<ManagedOrder[]>('/orders', { params });
    return response.data;
  },

  async confirmOrder(orderId: string): Promise<ManagedOrder> {
    const response = await apiClient.patch<ManagedOrder>(`/orders/${orderId}/confirm`);
    return response.data;
  },
};
