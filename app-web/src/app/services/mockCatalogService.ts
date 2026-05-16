import { Category, Product } from '../types/product';
import {
  CatalogCategory,
  CatalogProduct,
  Company,
  Order,
  OrderFormData,
  CartItem,
} from '../types/catalog';

const MOCK_USERS_KEY = 'mock_users';
const MOCK_CATEGORIES_KEY = 'mock_categories';
const MOCK_PRODUCTS_KEY = 'mock_products';
const MOCK_ORDERS_KEY = 'mock_orders';
const MOCK_DELAY = 300;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const generateId = () => Math.random().toString(36).substring(2, 11);

interface MockUser {
  id: string;
  email: string;
  name: string;
  establishmentName?: string;
  whatsapp?: string;
  logo?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

const getMockUsers = (): MockUser[] => {
  if (typeof window === 'undefined') return [];
  const users = localStorage.getItem(MOCK_USERS_KEY);
  return users ? JSON.parse(users) : [];
};

const getAllCategories = (): Category[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(MOCK_CATEGORIES_KEY);
  if (!data) return [];
  return JSON.parse(data);
};

const getAllProducts = (): Product[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(MOCK_PRODUCTS_KEY);
  if (!data) return [];
  return JSON.parse(data);
};

const getAllOrders = (): Order[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(MOCK_ORDERS_KEY);
  if (!data) return [];
  return JSON.parse(data);
};

const saveOrders = (orders: Order[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MOCK_ORDERS_KEY, JSON.stringify(orders));
};

export const mockCatalogService = {
  getCompanyBySlug: async (slug: string): Promise<Company | null> => {
    await delay(MOCK_DELAY);
    const users = getMockUsers();
    const user = users.find((u) => u.id === slug);
    if (!user) return null;
    const address = user.street
      ? `${user.street}, ${user.number} - ${user.neighborhood}, ${user.city}/${user.state}`
      : undefined;
    return {
      id: user.id,
      slug: user.id,
      name: user.establishmentName || user.name,
      logo: user.logo,
      whatsapp: user.whatsapp || '',
      address,
    };
  },

  getCatalogCategories: async (companyId: string): Promise<CatalogCategory[]> => {
    await delay(MOCK_DELAY);
    const allCategories = getAllCategories();
    const allProducts = getAllProducts();
    const companyCategories = allCategories
      .filter((c) => c.companyId === companyId && c.status === 'active')
      .sort((a, b) => a.name.localeCompare(b.name));
    const companyProducts = allProducts.filter(
      (p) => p.companyId === companyId && p.status === 'active',
    );
    return companyCategories.map((category) => {
      const categoryProducts = companyProducts
        .filter((p) => p.categoryId === category.id)
        .map((p) => ({
          ...p,
          availableStock: p.stockQuantity - p.reservedStock,
          isHighlighted: p.discount > 0 || p.stockQuantity > 10,
        }));
      return {
        ...category,
        products: categoryProducts,
      };
    });
  },

  getHighlightedProducts: async (companyId: string): Promise<CatalogProduct[]> => {
    await delay(MOCK_DELAY);
    const allProducts = getAllProducts();
    const companyProducts = allProducts.filter(
      (p) => p.companyId === companyId && p.status === 'active',
    );
    return companyProducts
      .filter((p) => p.discount > 0)
      .slice(0, 8)
      .map((p) => ({
        ...p,
        availableStock: p.stockQuantity - p.reservedStock,
        isHighlighted: true,
      }));
  },

  createOrder: async (
    companyId: string,
    customer: OrderFormData,
    items: CartItem[],
    total: number,
  ): Promise<Order> => {
    await delay(MOCK_DELAY);
    const orders = getAllOrders();
    const newOrder: Order = {
      id: 'order_' + generateId(),
      companyId,
      customer,
      items,
      total,
      createdAt: new Date().toISOString(),
    };
    orders.push(newOrder);
    saveOrders(orders);
    return newOrder;
  },
};
