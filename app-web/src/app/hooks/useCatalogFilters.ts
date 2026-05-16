'use client';

import { useState, useCallback, useMemo } from 'react';
import { CatalogCategory, CatalogFilters, CatalogProduct, DEFAULT_FILTERS } from '../types/catalog';

export function useCatalogFilters(categories: CatalogCategory[]) {
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_FILTERS);

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const setCategoryId = useCallback((categoryId: string) => {
    setFilters((prev) => ({ ...prev, categoryId }));
  }, []);

  const setAvailableOnly = useCallback((availableOnly: boolean) => {
    setFilters((prev) => ({ ...prev, availableOnly }));
  }, []);

  const setPromotionOnly = useCallback((promotionOnly: boolean) => {
    setFilters((prev) => ({ ...prev, promotionOnly }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const filterProduct = useCallback(
    (product: CatalogProduct): boolean => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const nameMatch = product.name.toLowerCase().includes(searchLower);
        const descMatch = product.description.toLowerCase().includes(searchLower);
        if (!nameMatch && !descMatch) return false;
      }
      if (filters.availableOnly && product.availableStock <= 0) return false;
      if (filters.promotionOnly && product.discount <= 0) return false;
      return true;
    },
    [filters],
  );

  const filteredCategories = useMemo(() => {
    let result = categories;
    if (filters.categoryId) {
      result = result.filter((c) => c.id === filters.categoryId);
    }
    return result
      .map((category) => ({
        ...category,
        products: category.products.filter(filterProduct),
      }))
      .filter((category) => category.products.length > 0);
  }, [categories, filters.categoryId, filterProduct]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.categoryId !== '' ||
      filters.availableOnly ||
      filters.promotionOnly
    );
  }, [filters]);

  return {
    filters,
    setSearch,
    setCategoryId,
    setAvailableOnly,
    setPromotionOnly,
    resetFilters,
    filteredCategories,
    hasActiveFilters,
  };
}
