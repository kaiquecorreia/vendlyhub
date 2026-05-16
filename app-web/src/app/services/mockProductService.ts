import { Category, CategoryFormData, Product, ProductFormData } from '../types/product';

const MOCK_CATEGORIES_KEY = 'mock_categories';
const MOCK_PRODUCTS_KEY = 'mock_products';
const MOCK_DELAY = 500;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const generateId = () => Math.random().toString(36).substring(2, 11);

const getCurrentCompanyId = (): string => {
  if (typeof window === 'undefined') return '';
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      return user.id || '';
    } catch {
      return '';
    }
  }
  return '';
};

const getAllCategories = (): Category[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(MOCK_CATEGORIES_KEY);
  if (!data) return [];
  return JSON.parse(data);
};

const getCategories = (companyId: string): Category[] => {
  const allCategories = getAllCategories();
  return allCategories.filter((c) => c.companyId === companyId);
};

const saveCategories = (categories: Category[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MOCK_CATEGORIES_KEY, JSON.stringify(categories));
};

const getAllProducts = (): Product[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(MOCK_PRODUCTS_KEY);
  if (!data) return [];
  return JSON.parse(data);
};

const getProducts = (companyId: string): Product[] => {
  const allProducts = getAllProducts();
  return allProducts.filter((p) => p.companyId === companyId);
};

const saveProducts = (products: Product[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MOCK_PRODUCTS_KEY, JSON.stringify(products));
};

export const mockProductService = {
  listCategories: async (): Promise<Category[]> => {
    await delay(MOCK_DELAY);
    const companyId = getCurrentCompanyId();
    return getCategories(companyId);
  },

  getCategory: async (id: string): Promise<Category | null> => {
    await delay(MOCK_DELAY);
    const companyId = getCurrentCompanyId();
    const categories = getCategories(companyId);
    return categories.find((c) => c.id === id) || null;
  },

  createCategory: async (data: CategoryFormData): Promise<Category> => {
    await delay(MOCK_DELAY);
    const companyId = getCurrentCompanyId();
    const allCategories = getAllCategories();
    const newCategory: Category = {
      id: 'cat_' + generateId(),
      companyId,
      name: data.name,
      description: data.description,
      status: data.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    allCategories.push(newCategory);
    saveCategories(allCategories);
    return newCategory;
  },

  updateCategory: async (id: string, data: CategoryFormData): Promise<Category> => {
    await delay(MOCK_DELAY);
    const companyId = getCurrentCompanyId();
    const allCategories = getAllCategories();
    const index = allCategories.findIndex((c) => c.id === id && c.companyId === companyId);
    if (index === -1) throw new Error('Categoria não encontrada');
    allCategories[index] = {
      ...allCategories[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveCategories(allCategories);
    return allCategories[index];
  },

  deleteCategory: async (id: string): Promise<void> => {
    await delay(MOCK_DELAY);
    const companyId = getCurrentCompanyId();
    const allCategories = getAllCategories();
    const filtered = allCategories.filter((c) => !(c.id === id && c.companyId === companyId));
    saveCategories(filtered);
  },

  listProducts: async (): Promise<Product[]> => {
    await delay(MOCK_DELAY);
    const companyId = getCurrentCompanyId();
    return getProducts(companyId);
  },

  getProduct: async (id: string): Promise<Product | null> => {
    await delay(MOCK_DELAY);
    const companyId = getCurrentCompanyId();
    const products = getProducts(companyId);
    return products.find((p) => p.id === id) || null;
  },

  createProduct: async (data: ProductFormData): Promise<Product> => {
    await delay(MOCK_DELAY);
    const companyId = getCurrentCompanyId();
    const allProducts = getAllProducts();
    const userCategories = getCategories(companyId);
    const category = userCategories.find((c) => c.id === data.categoryId);
    const categoryName = category?.name || '';
    const margin = data.cost > 0 ? ((data.salePrice - data.cost) / data.cost) * 100 : 0;
    const newProduct: Product = {
      id: 'prod_' + generateId(),
      companyId,
      name: data.name,
      sku: data.sku,
      categoryId: data.categoryId,
      categoryName,
      brand: data.brand,
      model: data.model,
      description: data.description,
      salePrice: data.salePrice,
      discount: data.discount || 0,
      cost: data.cost,
      margin: Math.round(margin * 100) / 100,
      unit: data.unit,
      stockQuantity: data.stockQuantity,
      reservedStock: data.reservedStock || 0,
      soldQuantity: data.soldQuantity || 0,
      minStock: data.minStock,
      supplier: data.supplier,
      supplierCode: data.supplierCode || '',
      ean: data.ean || '',
      status: data.status,
      imageUrl: data.imageUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    allProducts.push(newProduct);
    saveProducts(allProducts);
    return newProduct;
  },

  updateProduct: async (id: string, data: ProductFormData): Promise<Product> => {
    await delay(MOCK_DELAY);
    const companyId = getCurrentCompanyId();
    const allProducts = getAllProducts();
    const userCategories = getCategories(companyId);
    const index = allProducts.findIndex((p) => p.id === id && p.companyId === companyId);
    if (index === -1) throw new Error('Produto não encontrado');
    const category = userCategories.find((c) => c.id === data.categoryId);
    const categoryName = category?.name || '';
    const margin = data.cost > 0 ? ((data.salePrice - data.cost) / data.cost) * 100 : 0;
    allProducts[index] = {
      ...allProducts[index],
      ...data,
      categoryName,
      margin: Math.round(margin * 100) / 100,
      updatedAt: new Date().toISOString(),
    };
    saveProducts(allProducts);
    return allProducts[index];
  },

  deleteProduct: async (id: string): Promise<void> => {
    await delay(MOCK_DELAY);
    const companyId = getCurrentCompanyId();
    const allProducts = getAllProducts();
    const filtered = allProducts.filter((p) => !(p.id === id && p.companyId === companyId));
    saveProducts(filtered);
  },
};
