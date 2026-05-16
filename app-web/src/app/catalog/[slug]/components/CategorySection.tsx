'use client';

import { CatalogCategory, CatalogProduct } from '@/app/types/catalog';
import { ProductCard } from './ProductCard';
import styles from '../catalog.module.scss';

interface CategorySectionProps {
  category: CatalogCategory;
  establishmentLogoUrl?: string;
  establishmentName: string;
  getItemQuantity: (productId: string) => number;
  onAddItem: (product: CatalogProduct) => void;
  onRemoveItem: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  previewMode?: boolean;
  onPreviewStockChange?: (productId: string, nextStock: number) => void;
  onPreviewImageChange?: (productId: string, file: File) => void;
  disableCartActions?: boolean;
}

export function CategorySection({
  category,
  establishmentLogoUrl,
  establishmentName,
  getItemQuantity,
  onAddItem,
  onRemoveItem,
  onUpdateQuantity,
  previewMode = false,
  onPreviewStockChange,
  onPreviewImageChange,
  disableCartActions = false,
}: CategorySectionProps) {
  return (
    <section className={styles.categorySection}>
      <h2 className={styles.categoryTitle}>{category.name}</h2>
      {category.description && <p className={styles.categoryDescription}>{category.description}</p>}
      <div className={styles.productsGrid}>
        {category.products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            establishmentLogoUrl={establishmentLogoUrl}
            establishmentName={establishmentName}
            quantity={getItemQuantity(product.id)}
            onAdd={() => onAddItem(product)}
            onRemove={() => {
              const qty = getItemQuantity(product.id);
              if (qty > 1) {
                onUpdateQuantity(product.id, qty - 1);
              } else {
                onRemoveItem(product.id);
              }
            }}
            onUpdateQuantity={(qty) => onUpdateQuantity(product.id, qty)}
            previewMode={previewMode}
            disableCartActions={disableCartActions}
            onPreviewStockChange={
              onPreviewStockChange
                ? (nextStock) => onPreviewStockChange(product.id, nextStock)
                : undefined
            }
            onPreviewImageChange={
              onPreviewImageChange ? (file) => onPreviewImageChange(product.id, file) : undefined
            }
          />
        ))}
      </div>
    </section>
  );
}
