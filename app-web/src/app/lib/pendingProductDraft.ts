import type { CatalogCategory, CatalogProduct, Company } from '../types/catalog';
import type { Product, ProductFormData } from '../types/product';
import type { UserProfile } from '../services/profileService';
import { resolveMediaUrl } from '../services/mediaUrl';
import { toMobileSlug } from './mobileSlug';

export const PENDING_PRODUCT_DRAFT_KEY = 'vendlyhub:pendingProductDraft';

export const PENDING_PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export interface PendingProductDraftV1 {
  version: 1;
  name: string;
  salePrice: number;
  imageDataUrl?: string;
}

export interface PendingDraftProduct {
  id: string;
  name: string;
  salePrice: number;
  stockQuantity: number;
  imageDataUrl?: string;
}

export interface PendingProductDraftV2 {
  version: 2;
  products: PendingDraftProduct[];
  /** Nome exibido na prévia do catálogo (header) */
  storeDisplayName?: string;
  /** Logo da loja na prévia (data URL) */
  storeLogoDataUrl?: string;
  /** Código Pix Copia e Cola usado no checkout */
  pixCopyPaste?: string;
}

export type PendingProductDraft = PendingProductDraftV2;

export function parsePendingProductDraft(raw: string | null): PendingProductDraft | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'version' in parsed &&
      (parsed as PendingProductDraftV1).version === 1 &&
      typeof (parsed as PendingProductDraftV1).name === 'string' &&
      typeof (parsed as PendingProductDraftV1).salePrice === 'number'
    ) {
      const d = parsed as PendingProductDraftV1;
      if (d.imageDataUrl !== undefined && typeof d.imageDataUrl !== 'string') return null;
      return {
        version: 2,
        products: [
          {
            id: 'preview-product-1',
            name: d.name,
            salePrice: d.salePrice,
            stockQuantity: 100,
            imageDataUrl: d.imageDataUrl,
          },
        ],
        storeDisplayName: undefined,
        storeLogoDataUrl: undefined,
        pixCopyPaste: undefined,
      };
    }

    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'version' in parsed &&
      (parsed as PendingProductDraftV2).version === 2 &&
      Array.isArray((parsed as PendingProductDraftV2).products)
    ) {
      const products = (parsed as PendingProductDraftV2).products.filter(
        (product) =>
          typeof product.id === 'string' &&
          typeof product.name === 'string' &&
          typeof product.salePrice === 'number' &&
          typeof product.stockQuantity === 'number' &&
          (product.imageDataUrl === undefined || typeof product.imageDataUrl === 'string'),
      );
      if (products.length > 0) {
        const v2 = parsed as PendingProductDraftV2;
        const storeDisplayName =
          typeof v2.storeDisplayName === 'string' ? v2.storeDisplayName : undefined;
        const storeLogoDataUrl =
          typeof v2.storeLogoDataUrl === 'string' ? v2.storeLogoDataUrl : undefined;
        const pixCopyPaste = typeof v2.pixCopyPaste === 'string' ? v2.pixCopyPaste : undefined;
        return {
          version: 2,
          products,
          storeDisplayName,
          storeLogoDataUrl,
          pixCopyPaste,
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function loadPendingProductDraft(): PendingProductDraft | null {
  if (typeof window === 'undefined') return null;
  return parsePendingProductDraft(localStorage.getItem(PENDING_PRODUCT_DRAFT_KEY));
}

export function savePendingProductDraft(draft: PendingProductDraft): void {
  localStorage.setItem(PENDING_PRODUCT_DRAFT_KEY, JSON.stringify(draft));
}

export function clearPendingProductDraft(): void {
  localStorage.removeItem(PENDING_PRODUCT_DRAFT_KEY);
}

/** Approximate byte size of a data URL (base64 payload). */
export function dataUrlByteLength(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  if (comma === -1) return dataUrl.length;
  const b64 = dataUrl.slice(comma + 1).replace(/\s/g, '');
  return Math.floor((b64.length * 3) / 4);
}

export function dataUrlToFile(dataUrl: string, filename = 'product.jpg'): File | null {
  const m = /^data:([^;]+);base64,([\s\S]+)$/.exec(dataUrl.trim());
  if (!m) return null;
  const mime = m[1];
  const b64 = m[2].replace(/\s/g, '');
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], filename, { type: mime });
  } catch {
    return null;
  }
}

const PREVIEW_CATEGORY_ID = 'preview-category';
const PREVIEW_COMPANY_ID = 'preview';

export function buildPreviewCatalogFromDraft(draft: PendingProductDraft): {
  company: Company;
  categories: CatalogCategory[];
  highlightedProducts: CatalogProduct[];
} {
  const now = new Date().toISOString();
  const products: CatalogProduct[] = draft.products.map((draftProduct, index) => ({
    id: draftProduct.id,
    companyId: PREVIEW_COMPANY_ID,
    name: draftProduct.name.trim(),
    sku: `PREVIEW-${index + 1}`,
    categoryId: PREVIEW_CATEGORY_ID,
    categoryName: 'Produtos',
    brand: '',
    model: '',
    description: '',
    salePrice: draftProduct.salePrice,
    discount: 0,
    cost: 0,
    margin: 0,
    unit: '',
    stockQuantity: draftProduct.stockQuantity,
    reservedStock: 0,
    soldQuantity: 0,
    minStock: 0,
    supplier: '',
    supplierCode: '',
    ean: '',
    status: 'active',
    imageUrl: draftProduct.imageDataUrl,
    createdAt: now,
    updatedAt: now,
    availableStock: draftProduct.stockQuantity,
    isHighlighted: false,
  }));

  const category: CatalogCategory = {
    id: PREVIEW_CATEGORY_ID,
    companyId: PREVIEW_COMPANY_ID,
    name: 'Produtos',
    description: undefined,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    products,
  };

  const displayName = draft.storeDisplayName?.trim();
  const company: Company = {
    id: PREVIEW_COMPANY_ID,
    slug: 'preview',
    name: displayName && displayName.length > 0 ? displayName : 'Sua loja',
    logo: draft.storeLogoDataUrl?.trim() || undefined,
    whatsapp: '',
    pixCopyPaste: draft.pixCopyPaste?.trim() || undefined,
    address: undefined,
  };

  return {
    company,
    categories: [category],
    highlightedProducts: [],
  };
}

export function pendingDraftToMinimalFormData(draft: PendingProductDraft): ProductFormData {
  const firstProduct = draft.products[0];
  if (!firstProduct) {
    throw new Error('Nenhum produto pendente encontrado');
  }
  const image =
    firstProduct.imageDataUrl && firstProduct.imageDataUrl.length > 0
      ? dataUrlToFile(firstProduct.imageDataUrl, 'product-image.webp')
      : undefined;

  return {
    name: firstProduct.name.trim(),
    sku: '',
    categoryId: '',
    brand: '',
    model: '',
    description: '',
    salePrice: firstProduct.salePrice,
    discount: 0,
    cost: 0,
    unit: '',
    stockQuantity: firstProduct.stockQuantity,
    reservedStock: 0,
    soldQuantity: 0,
    minStock: 0,
    supplier: '',
    status: 'active',
    image: image ?? null,
  };
}

export function pendingDraftToMinimalFormDataList(draft: PendingProductDraft): ProductFormData[] {
  return draft.products.map((product) => ({
    name: product.name.trim(),
    sku: '',
    categoryId: '',
    brand: '',
    model: '',
    description: '',
    salePrice: product.salePrice,
    discount: 0,
    cost: 0,
    unit: '',
    stockQuantity: product.stockQuantity,
    reservedStock: 0,
    soldQuantity: 0,
    minStock: 0,
    supplier: '',
    status: 'active',
    image:
      product.imageDataUrl && product.imageDataUrl.length > 0
        ? dataUrlToFile(product.imageDataUrl, 'product-image.webp')
        : null,
  }));
}

const UNCATEGORIZED_ID = 'uncategorized';

/**
 * Converts real API products + user profile into the same catalog shape
 * that CatalogView expects, so the preview page can render authenticated data.
 */
export function buildCatalogFromApiProducts(
  products: Product[],
  profile: UserProfile,
): {
  company: Company;
  categories: CatalogCategory[];
  highlightedProducts: CatalogProduct[];
} {
  const est = profile.establishment;
  const mobileSlug = toMobileSlug(est?.mobile_number);
  const company: Company = {
    id: est?.establishmentId ?? 'unknown',
    slug: mobileSlug || 'unknown',
    name: est?.name ?? 'Sua loja',
    logo: resolveMediaUrl(est?.logo) ?? undefined,
    whatsapp: '',
    pixCopyPaste: est?.pixCopyPaste ?? undefined,
    address: undefined,
  };

  const grouped = new Map<string, CatalogProduct[]>();
  const categoryNames = new Map<string, string>();

  for (const p of products) {
    const catId = p.categoryId || UNCATEGORIZED_ID;
    const catName = p.categoryName || 'Produtos';
    const catalogProduct: CatalogProduct = {
      ...p,
      imageUrl: resolveMediaUrl(p.imageUrl) ?? undefined,
      availableStock: p.stockQuantity - p.reservedStock,
      isHighlighted: false,
    };
    if (!grouped.has(catId)) grouped.set(catId, []);
    grouped.get(catId)!.push(catalogProduct);
    if (!categoryNames.has(catId)) categoryNames.set(catId, catName);
  }

  const now = new Date().toISOString();
  const categories: CatalogCategory[] = Array.from(grouped.entries()).map(
    ([catId, catProducts]) => ({
      id: catId,
      companyId: company.id,
      name: categoryNames.get(catId) ?? 'Produtos',
      description: undefined,
      status: 'active' as const,
      createdAt: now,
      updatedAt: now,
      products: catProducts,
    }),
  );

  return { company, categories, highlightedProducts: [] };
}
