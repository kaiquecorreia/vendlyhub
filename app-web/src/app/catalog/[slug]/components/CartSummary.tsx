'use client';

import { Cart } from '@/app/types/catalog';
import { ShoppingCart } from 'lucide-react';
import styles from '../catalog.module.scss';

interface CartSummaryProps {
  cart: Cart;
  onCheckout: () => void;
  previewMode?: boolean;
}

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export function CartSummary({ cart, onCheckout, previewMode }: CartSummaryProps) {
  if (cart.items.length === 0) return null;

  return (
    <div className={styles.cartSummary}>
      <div className={styles.cartInfo}>
        <ShoppingCart size={20} />
        <span className={styles.cartCount}>{cart.itemCount} itens</span>
        <span className={styles.cartTotal}>{formatCurrency(cart.total)}</span>
      </div>
      <button
        type="button"
        onClick={onCheckout}
        className={styles.checkoutBtn}
        disabled={previewMode}
        title={previewMode ? 'Prévia: cadastre-se para enviar pedidos' : undefined}
      >
        {previewMode ? 'Prévia — cadastre-se para vender' : 'Gerar pedido'}
      </button>
    </div>
  );
}
