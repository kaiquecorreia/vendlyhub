const SESSION_HIGHLIGHT_SHARE_CATALOG_KEY = 'vendlyhub:productsHighlightShareCatalog';

export function setHighlightShareCatalogFlag(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_HIGHLIGHT_SHARE_CATALOG_KEY, '1');
}

/**
 * Returns true once if the flag was set (e.g. after onboarding), then clears it.
 */
export function consumeHighlightShareCatalogFlag(): boolean {
  if (typeof window === 'undefined') return false;
  const v = sessionStorage.getItem(SESSION_HIGHLIGHT_SHARE_CATALOG_KEY);
  if (v !== '1') return false;
  sessionStorage.removeItem(SESSION_HIGHLIGHT_SHARE_CATALOG_KEY);
  return true;
}
