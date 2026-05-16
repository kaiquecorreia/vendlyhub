'use client';

import { Category } from '@/app/types/product';
import { CatalogFilters as FiltersType } from '@/app/types/catalog';
import { Search, X } from 'lucide-react';
import styles from '../catalog.module.scss';

interface CatalogFiltersProps {
  filters: FiltersType;
  categories: Category[];
  showCategoryFilter: boolean;
  showAvailabilityFilter: boolean;
  showPromotionFilter: boolean;
  onSearchChange: (value: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onAvailableOnlyChange: (value: boolean) => void;
  onPromotionOnlyChange: (value: boolean) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export function CatalogFilters({
  filters,
  categories,
  showCategoryFilter,
  showAvailabilityFilter,
  showPromotionFilter,
  onSearchChange,
  onCategoryChange,
  onAvailableOnlyChange,
  onPromotionOnlyChange,
  onReset,
  hasActiveFilters,
}: CatalogFiltersProps) {
  return (
    <div className={styles.filtersContainer}>
      <div className={styles.searchWrapper}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Buscar produtos..."
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.searchInput}
        />
      </div>
      <div className={styles.filtersRow}>
        {showCategoryFilter && (
          <select
            value={filters.categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        )}
        {showAvailabilityFilter && (
          <label className={styles.filterCheckbox}>
            <input
              type="checkbox"
              checked={filters.availableOnly}
              onChange={(e) => onAvailableOnlyChange(e.target.checked)}
            />
            <span>Disponíveis</span>
          </label>
        )}
        {showPromotionFilter && (
          <label className={styles.filterCheckbox}>
            <input
              type="checkbox"
              checked={filters.promotionOnly}
              onChange={(e) => onPromotionOnlyChange(e.target.checked)}
            />
            <span>Promoções</span>
          </label>
        )}
        {hasActiveFilters && (
          <button onClick={onReset} className={styles.clearFilters}>
            <X size={14} />
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}
