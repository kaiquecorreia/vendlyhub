'use client';

import { useState, useCallback, useMemo } from 'react';
import { Cart, CartItem, CatalogProduct } from '../types/catalog';

const EMPTY_CART: Cart = {
  items: [],
  total: 0,
  itemCount: 0,
};

const calculateItemPrice = (product: CatalogProduct): number => {
  if (product.discount > 0) {
    return product.salePrice * (1 - product.discount / 100);
  }
  return product.salePrice;
};

const calculateCartTotals = (items: CartItem[]): { total: number; itemCount: number } => {
  return items.reduce(
    (acc, item) => {
      const price = calculateItemPrice(item.product);
      return {
        total: acc.total + price * item.quantity,
        itemCount: acc.itemCount + item.quantity,
      };
    },
    { total: 0, itemCount: 0 },
  );
};

export function useCart() {
  const [cart, setCart] = useState<Cart>(EMPTY_CART);

  const addItem = useCallback((product: CatalogProduct, quantity: number = 1) => {
    if (product.availableStock <= 0) return;
    setCart((prev) => {
      const existingIndex = prev.items.findIndex((item) => item.product.id === product.id);
      let newItems: CartItem[];
      if (existingIndex >= 0) {
        const existingItem = prev.items[existingIndex];
        const newQuantity = Math.min(existingItem.quantity + quantity, product.availableStock);
        newItems = [...prev.items];
        newItems[existingIndex] = { ...existingItem, quantity: newQuantity };
      } else {
        const addQuantity = Math.min(quantity, product.availableStock);
        newItems = [...prev.items, { product, quantity: addQuantity }];
      }
      const { total, itemCount } = calculateCartTotals(newItems);
      return { items: newItems, total, itemCount };
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCart((prev) => {
      const newItems = prev.items.filter((item) => item.product.id !== productId);
      const { total, itemCount } = calculateCartTotals(newItems);
      return { items: newItems, total, itemCount };
    });
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId);
        return;
      }
      setCart((prev) => {
        const newItems = prev.items.map((item) => {
          if (item.product.id === productId) {
            const newQuantity = Math.min(quantity, item.product.availableStock);
            return { ...item, quantity: newQuantity };
          }
          return item;
        });
        const { total, itemCount } = calculateCartTotals(newItems);
        return { items: newItems, total, itemCount };
      });
    },
    [removeItem],
  );

  const clearCart = useCallback(() => {
    setCart(EMPTY_CART);
  }, []);

  const getItemQuantity = useCallback(
    (productId: string): number => {
      const item = cart.items.find((i) => i.product.id === productId);
      return item?.quantity || 0;
    },
    [cart.items],
  );

  const isEmpty = useMemo(() => cart.items.length === 0, [cart.items]);

  return {
    cart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemQuantity,
    isEmpty,
  };
}
