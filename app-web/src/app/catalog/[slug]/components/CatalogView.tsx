'use client';

import { useState } from 'react';
import { ReactNode } from 'react';
import { useCart } from '@/app/hooks/useCart';
import { useCatalogFilters } from '@/app/hooks/useCatalogFilters';
import { feedback } from '@/app/services/feedback';
import { orderService } from '@/app/services/orderService';
import { whatsappService } from '@/app/services/whatsappService';
import { CatalogCategory, CatalogProduct, Company, OrderFormData } from '@/app/types/catalog';
import { CatalogHeader, type AuthActions } from './CatalogHeader';
import { CatalogFilters } from './CatalogFilters';
import { HighlightedProducts } from './HighlightedProducts';
import { CategorySection } from './CategorySection';
import { CartSummary } from './CartSummary';
import { OrderModal } from './OrderModal';
import { ShoppingBag, AlertCircle, Eye } from 'lucide-react';
import styles from '../catalog.module.scss';

export interface CatalogViewProps {
  slug: string;
  company: Company;
  categories: CatalogCategory[];
  highlightedProducts: CatalogProduct[];
  previewMode?: boolean;
  previewBanner?: string;
  previewCta?: {
    href?: string;
    label: string;
    onClick?: () => void;
    variant?: 'share' | 'copy';
  };
  previewStoreEdit?: {
    onPickLogo: (file: File) => void;
    storeDisplayName: string;
    onStoreDisplayNameChange: (name: string) => void;
  };
  previewAdmin?: {
    onAddProduct?: () => void;
    onPreviewStockChange?: (productId: string, nextStock: number) => void;
    onPreviewImageChange?: (productId: string, file: File) => void;
  };
  onPickLogo?: (file: File) => void;
  authActions?: AuthActions;
  dashboardHref?: string;
  preProductsContent?: ReactNode;
  disableCartActions?: boolean;
}

export function CatalogView({
  slug,
  company,
  categories,
  highlightedProducts,
  previewMode = false,
  previewBanner,
  previewCta,
  previewStoreEdit,
  previewAdmin,
  onPickLogo,
  authActions,
  dashboardHref,
  preProductsContent,
  disableCartActions = false,
}: CatalogViewProps) {
  const { cart, addItem, removeItem, updateQuantity, getItemQuantity, isEmpty } = useCart();
  const {
    filters,
    setSearch,
    setCategoryId,
    setAvailableOnly,
    setPromotionOnly,
    resetFilters,
    filteredCategories,
  } = useCatalogFilters(categories);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [generatingOrder, setGeneratingOrder] = useState(false);
  const [sendingOrder, setSendingOrder] = useState(false);
  const [orderGenerated, setOrderGenerated] = useState(false);
  const [generatedCustomerData, setGeneratedCustomerData] = useState<OrderFormData | null>(null);
  const isCartDisabled = previewMode || disableCartActions;

  const handleCloseOrderModal = () => {
    setIsOrderModalOpen(false);
    setOrderGenerated(false);
    setGeneratedCustomerData(null);
    setGeneratingOrder(false);
    setSendingOrder(false);
  };

  const handleCheckout = () => {
    if (isCartDisabled) {
      feedback.info('Cadastre-se para receber pedidos reais no seu catálogo.');
      return;
    }
    if (isEmpty) {
      feedback.error('Adicione itens ao carrinho');
      return;
    }
    setIsOrderModalOpen(true);
  };

  const handleGenerateOrder = async (customerData: OrderFormData) => {
    if (!company || isCartDisabled) return;
    setGeneratingOrder(true);
    try {
      await orderService.createOrder(slug, customerData, cart.items);
      setGeneratedCustomerData(customerData);
      setOrderGenerated(true);
      feedback.success('Pedido gerado! Realize o pagamento e envie pelo WhatsApp.');
    } catch (err) {
      feedback.error('Erro ao gerar pedido');
      console.error(err);
    } finally {
      setGeneratingOrder(false);
    }
  };

  const handleSendOrderWhatsapp = () => {
    if (!generatedCustomerData || !company) return;
    setSendingOrder(true);
    try {
      whatsappService.sendOrder(company.whatsapp, generatedCustomerData, cart.items, cart.total);
      feedback.success('Pedido enviado para o WhatsApp!');
    } catch (err) {
      feedback.error('Erro ao abrir WhatsApp para envio');
      console.error(err);
    } finally {
      setSendingOrder(false);
    }
  };

  const allCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    companyId: c.companyId,
    description: c.description,
    status: c.status,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
  const allProducts = categories.flatMap((category) => category.products);
  const showCategoryFilter = allCategories.length > 1;
  const showPromotionFilter = allProducts.some((product) => product.discount > 0);
  const hasAvailableProducts = allProducts.some((product) => product.availableStock > 0);
  const hasUnavailableProducts = allProducts.some((product) => product.availableStock <= 0);
  const showAvailabilityFilter = hasAvailableProducts && hasUnavailableProducts;
  const hasEffectiveActiveFilters =
    filters.search !== '' ||
    (showCategoryFilter && filters.categoryId !== '') ||
    (showAvailabilityFilter && filters.availableOnly) ||
    (showPromotionFilter && filters.promotionOnly);
  const hasProducts = filteredCategories.some((c) => c.products.length > 0);

  const pixCopyPaste = company.pixCopyPaste;

  return (
    <div className={styles.catalogContainer}>
      <CatalogHeader
        company={company}
        previewCta={previewCta}
        previewStoreEdit={previewStoreEdit}
        onPickLogo={onPickLogo}
        authActions={authActions}
        dashboardHref={dashboardHref}
      />
      {previewBanner && (
        <div className={styles.previewBanner}>
          <Eye size={16} aria-hidden />
          <span>{previewBanner}</span>
        </div>
      )}
      <main className={styles.mainContent}>
        <CatalogFilters
          filters={filters}
          categories={allCategories}
          showCategoryFilter={showCategoryFilter}
          showPromotionFilter={showPromotionFilter}
          showAvailabilityFilter={showAvailabilityFilter}
          onSearchChange={setSearch}
          onCategoryChange={setCategoryId}
          onAvailableOnlyChange={setAvailableOnly}
          onPromotionOnlyChange={setPromotionOnly}
          onReset={resetFilters}
          hasActiveFilters={hasEffectiveActiveFilters}
        />
        {previewAdmin?.onAddProduct && (
          <button
            type="button"
            className={styles.previewAddProductButton}
            onClick={previewAdmin.onAddProduct}
          >
            Adicionar novo produto
          </button>
        )}
        {preProductsContent}
        {!previewMode && !hasEffectiveActiveFilters && highlightedProducts.length > 0 && (
          <HighlightedProducts
            products={highlightedProducts}
            establishmentLogoUrl={company.logo}
            establishmentName={company.name}
            getItemQuantity={getItemQuantity}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            onUpdateQuantity={updateQuantity}
            disableCartActions={disableCartActions}
          />
        )}
        {hasProducts ? (
          filteredCategories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              establishmentLogoUrl={company.logo}
              establishmentName={company.name}
              getItemQuantity={getItemQuantity}
              onAddItem={addItem}
              onRemoveItem={removeItem}
              onUpdateQuantity={updateQuantity}
              previewMode={previewMode}
              onPreviewStockChange={previewAdmin?.onPreviewStockChange}
              onPreviewImageChange={previewAdmin?.onPreviewImageChange}
              disableCartActions={disableCartActions}
            />
          ))
        ) : (
          <div className={styles.emptyState}>
            <ShoppingBag size={48} />
            <h2>Nenhum produto encontrado</h2>
            <p>Tente ajustar os filtros ou buscar por outro termo.</p>
          </div>
        )}
      </main>
      {!isCartDisabled && (
        <CartSummary cart={cart} onCheckout={handleCheckout} previewMode={previewMode} />
      )}
      <OrderModal
        isOpen={isOrderModalOpen && !isCartDisabled}
        onClose={handleCloseOrderModal}
        cart={cart}
        onGenerateOrder={handleGenerateOrder}
        onSendOrder={handleSendOrderWhatsapp}
        generating={generatingOrder}
        sending={sendingOrder}
        orderGenerated={orderGenerated}
        pixCopyPaste={pixCopyPaste}
      />
    </div>
  );
}

export function CatalogLoadingState() {
  return (
    <div className={styles.catalogContainer}>
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <h2>Carregando catálogo...</h2>
      </div>
    </div>
  );
}

export function CatalogErrorState({ message }: { message: string }) {
  return (
    <div className={styles.catalogContainer}>
      <div className={styles.errorState}>
        <AlertCircle size={48} />
        <h2>{message}</h2>
        <p>Verifique o endereço e tente novamente.</p>
      </div>
    </div>
  );
}
