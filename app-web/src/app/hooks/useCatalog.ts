'use client';

import { useState, useEffect, useCallback } from 'react';
import { CatalogCategory, CatalogProduct, Company } from '../types/catalog';
import { catalogService } from '../services/catalogService';
import { getValidMobileSlug } from '../lib/mobileSlug';

interface UseCatalogResult {
  company: Company | null;
  categories: CatalogCategory[];
  highlightedProducts: CatalogProduct[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useCatalog(slug: string): UseCatalogResult {
  const [company, setCompany] = useState<Company | null>(null);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [highlightedProducts, setHighlightedProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    const normalizedSlug = getValidMobileSlug(slug);
    if (!normalizedSlug) {
      setError('Empresa não encontrada');
      setCompany(null);
      setCategories([]);
      setHighlightedProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [catalogData, highlightedData] = await Promise.all([
        catalogService.getCatalogBySlug(normalizedSlug),
        catalogService.getHighlightedProducts(normalizedSlug),
      ]);
      setCompany(catalogData.company);
      setCategories(catalogData.categories);
      setHighlightedProducts(highlightedData);
    } catch (err) {
      setError('Erro ao carregar catálogo');
      setCompany(null);
      setCategories([]);
      setHighlightedProducts([]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  return {
    company,
    categories,
    highlightedProducts,
    loading,
    error,
    reload: loadCatalog,
  };
}
