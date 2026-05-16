'use client';

import { useRef } from 'react';
import { CatalogProduct } from '@/app/types/catalog';
import { resolveProductImageUrl } from '@/app/services/mediaUrl';
import { Minus, Plus, ShoppingCart, Upload } from 'lucide-react';
import styles from '../catalog.module.scss';

interface ProductCardProps {
  product: CatalogProduct;
  establishmentLogoUrl?: string;
  establishmentName: string;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  onUpdateQuantity: (quantity: number) => void;
  previewMode?: boolean;
  disableCartActions?: boolean;
  onPreviewStockChange?: (nextStock: number) => void;
  onPreviewImageChange?: (file: File) => void;
}

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export function ProductCard({
  product,
  establishmentLogoUrl,
  establishmentName,
  quantity,
  onAdd,
  onRemove,
  onUpdateQuantity,
  disableCartActions = false,
  onPreviewStockChange,
  onPreviewImageChange,
}: ProductCardProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const canChangeImage = Boolean(onPreviewImageChange);
  const hasProductImage = Boolean(product.imageUrl?.trim());
  const productImageUrl = resolveProductImageUrl(product.imageUrl, establishmentLogoUrl);
  const establishmentInitial = establishmentName.trim().charAt(0).toUpperCase() || '?';

  const hasDiscount = product.discount > 0;
  const finalPrice = hasDiscount
    ? product.salePrice * (1 - product.discount / 100)
    : product.salePrice;
  const isOutOfStock = product.availableStock <= 0;

  const handleImageAreaClick = () => {
    if (canChangeImage) imageInputRef.current?.click();
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onPreviewImageChange?.(file);
    event.target.value = '';
  };

  return (
    <div className={`${styles.productCard} ${isOutOfStock ? styles.outOfStock : ''}`}>
      {hasDiscount && <span className={styles.discountBadge}>-{product.discount}%</span>}
      <div
        className={`${styles.productImageWrapper} ${canChangeImage ? styles.productImageEditable : ''}`}
        onClick={handleImageAreaClick}
        role={canChangeImage ? 'button' : undefined}
        tabIndex={canChangeImage ? 0 : undefined}
        onKeyDown={
          canChangeImage
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') handleImageAreaClick();
              }
            : undefined
        }
      >
        {productImageUrl ? (
          <img src={productImageUrl} alt={product.name} className={styles.productImage} />
        ) : (
          <div className={styles.productImagePlaceholder} aria-label={establishmentName}>
            <span className={styles.productImageFallbackInitial}>{establishmentInitial}</span>
          </div>
        )}
        {!hasProductImage && <p className={styles.missingProductPhotoNotice}>Produto sem foto</p>}
        {canChangeImage && (
          <>
            <div className={styles.productImageOverlay}>
              <Upload size={20} />
              <span>Trocar foto</span>
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageFileChange}
              style={{ display: 'none' }}
            />
          </>
        )}
      </div>
      <div className={styles.productInfo}>
        <h3 className={styles.productName}>{product.name}</h3>
        <p className={styles.productDescription}>{product.description}</p>
        <div className={styles.productPricing}>
          {hasDiscount && (
            <span className={styles.originalPrice}>{formatCurrency(product.salePrice)}</span>
          )}
          <span className={styles.finalPrice}>{formatCurrency(finalPrice)}</span>
        </div>
        {isOutOfStock ? (
          <span className={styles.outOfStockLabel}>Indisponível</span>
        ) : (
          <div className={styles.productActions}>
            {!disableCartActions &&
              (quantity > 0 ? (
                <div className={styles.quantityControls}>
                  <button onClick={onRemove} className={styles.quantityBtn}>
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => onUpdateQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                    min="0"
                    max={product.availableStock}
                    className={styles.quantityInput}
                  />
                  <button
                    onClick={onAdd}
                    disabled={quantity >= product.availableStock}
                    className={styles.quantityBtn}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ) : (
                <button onClick={onAdd} className={styles.addToCartBtn}>
                  <ShoppingCart size={16} />
                  Adicionar
                </button>
              ))}
            <span className={styles.stockInfo}>{product.availableStock} disponíveis</span>
            {onPreviewStockChange && (
              <div className={styles.previewAdminActions}>
                <div className={styles.previewStockEditor}>
                  <span className={styles.previewStockLabel}>Estoque</span>
                  <div className={styles.previewStockStepper}>
                    <button
                      type="button"
                      className={styles.previewStockBtn}
                      disabled={product.stockQuantity <= 0}
                      onClick={() => onPreviewStockChange?.(Math.max(0, product.stockQuantity - 1))}
                      aria-label="Diminuir estoque"
                    >
                      <Minus size={22} strokeWidth={2.5} />
                    </button>
                    <span className={styles.previewStockValue}>{product.availableStock}</span>
                    <button
                      type="button"
                      className={styles.previewStockBtn}
                      onClick={() => onPreviewStockChange?.(product.stockQuantity + 1)}
                      aria-label="Aumentar estoque"
                    >
                      <Plus size={22} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
