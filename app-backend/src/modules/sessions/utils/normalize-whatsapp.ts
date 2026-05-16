import { normalizeMobileSlug } from '../../../shared/utils/mobile-slug';

export function normalizeWhatsapp(value: string): string {
  return normalizeMobileSlug(value);
}
