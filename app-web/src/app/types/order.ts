export type OrderStatus = 'pending' | 'confirmed' | 'cancelled';

export interface ManagedOrderItem {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
}

export interface ManagedOrder {
  id: string;
  establishmentId: string;
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  customerWhatsapp: string;
  customerAddress: string;
  notes?: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: ManagedOrderItem[];
}
