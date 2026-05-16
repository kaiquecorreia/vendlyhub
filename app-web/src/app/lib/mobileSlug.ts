const MOBILE_SLUG_MIN_LENGTH = 10;
const MOBILE_SLUG_MAX_LENGTH = 11;
const MOBILE_FIELD_LITERAL = 'mobile_number';
const BRAZIL_DDI = '55';

function stripBrazilDdiIfPresent(digits: string): string {
  if (!digits.startsWith(BRAZIL_DDI)) {
    return digits;
  }

  const nationalDigits = digits.slice(BRAZIL_DDI.length);
  if (
    nationalDigits.length >= MOBILE_SLUG_MIN_LENGTH &&
    nationalDigits.length <= MOBILE_SLUG_MAX_LENGTH
  ) {
    return nationalDigits;
  }

  return digits;
}

export function toMobileSlug(mobile?: string | null): string {
  const normalized = String(mobile ?? '').trim();
  if (normalized.toLowerCase() === MOBILE_FIELD_LITERAL) {
    return '';
  }
  const digits = normalized.replace(/\D/g, '');
  return stripBrazilDdiIfPresent(digits);
}

export function isValidMobileSlug(slug: string): boolean {
  return slug.length >= MOBILE_SLUG_MIN_LENGTH && slug.length <= MOBILE_SLUG_MAX_LENGTH;
}

export function getValidMobileSlug(mobile?: string | null): string | null {
  const slug = toMobileSlug(mobile);
  return isValidMobileSlug(slug) ? slug : null;
}

export function buildCatalogUrl(origin: string, mobile?: string | null): string | null {
  const slug = getValidMobileSlug(mobile);
  if (!slug) {
    return null;
  }
  return `${origin}/catalog/${slug}`;
}
