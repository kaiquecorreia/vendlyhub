const MOBILE_SLUG_MIN_LENGTH = 10;
const MOBILE_SLUG_MAX_LENGTH = 11;
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

export function normalizeMobileSlug(value: string): string {
  const digits = value.replace(/\D/g, '');
  return stripBrazilDdiIfPresent(digits);
}

export function isValidMobileSlug(value: string): boolean {
  return (
    value.length >= MOBILE_SLUG_MIN_LENGTH &&
    value.length <= MOBILE_SLUG_MAX_LENGTH
  );
}

export function getMobileSlugLookupCandidates(value: string): string[] {
  const normalized = normalizeMobileSlug(value);
  if (!isValidMobileSlug(normalized)) {
    return [];
  }

  return [normalized, `${BRAZIL_DDI}${normalized}`];
}
