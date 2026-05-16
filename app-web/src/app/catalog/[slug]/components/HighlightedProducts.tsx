'use client';

import { CatalogProduct } from '@/app/types/catalog';
import { ProductCard } from './ProductCard';
import { Sparkles } from 'lucide-react';
import styles from '../catalog.module.scss';

interface HighlightedProductsProps {
  products: CatalogProduct[];
  establishmentLogoUrl?: string;
  establishmentName: string;
  getItemQuantity: (productId: string) => number;
  onAddItem: (product: CatalogProduct) => void;
  onRemoveItem: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  disableCartActions?: boolean;
}

export function HighlightedProducts({
  products,
  establishmentLogoUrl,
  establishmentName,
  getItemQuantity,
  onAddItem,
  onRemoveItem,
  onUpdateQuantity,
  disableCartActions = false,
}: HighlightedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className={styles.highlightedSection}>
      <h2 className={styles.sectionTitle}>
        <Sparkles size={20} />
        Destaques
      </h2>
      <div className={styles.highlightedGrid}>
        {products.map((product) => (
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
            disableCartActions={disableCartActions}
          />
        ))}
      </div>
    </section>
  );
}
