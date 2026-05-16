'use client';

import { useParams } from 'next/navigation';
import { useCatalog } from '@/app/hooks/useCatalog';
import { toMobileSlug } from '@/app/lib/mobileSlug';
import { CatalogErrorState, CatalogLoadingState, CatalogView } from './components/CatalogView';

export default function CatalogPage() {
  const params = useParams();
  const slug = toMobileSlug(params.slug as string);
  const { company, categories, highlightedProducts, loading, error } = useCatalog(slug);

  if (loading) {
    return <CatalogLoadingState />;
  }

  if (error || !company) {
    return <CatalogErrorState message={error || 'Empresa não encontrada'} />;
  }

  return (
    <CatalogView
      slug={slug}
      company={company}
      categories={categories}
      highlightedProducts={highlightedProducts}
    />
  );
}
