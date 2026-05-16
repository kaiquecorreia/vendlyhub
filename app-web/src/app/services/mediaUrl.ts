const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
const localOnboardingMascotVideoSources = [
  { src: '/mascot.webm', type: 'video/webm' },
  { src: '/mascot.mp4', type: 'video/mp4' },
];
const onboardingMascotVideoPathOverride =
  process.env.NEXT_PUBLIC_ONBOARDING_MASCOT_VIDEO_PATH?.trim() || '';

export type OnboardingMascotVideoSource = { src: string; type: string };

function inferVideoMimeType(url: string): string {
  if (/\.webm($|\?)/i.test(url)) return 'video/webm';
  if (/\.mov($|\?)/i.test(url)) return 'video/quicktime';
  return 'video/mp4';
}

/**
 * Turns API paths like `/uploads/products/foo.jpg` into absolute URLs on the API host.
 * Leaves `http(s):`, `data:`, and `blob:` URLs unchanged.
 */
export function resolveMediaUrl(pathOrUrl: string | undefined | null): string | undefined {
  if (pathOrUrl == null || pathOrUrl === '') return undefined;
  const trimmed = pathOrUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;
  if (!apiBase) return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${apiBase}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}

/**
 * Returns product image URL, falling back to establishment logo when available.
 */
export function resolveProductImageUrl(
  imageUrl: string | undefined | null,
  establishmentLogoUrl?: string | null,
): string | undefined {
  const resolved = resolveMediaUrl(imageUrl);
  if (resolved) return resolved;
  return resolveMediaUrl(establishmentLogoUrl);
}

/**
 * Returns onboarding mascot video sources.
 * Local transparent WebM is preferred; MP4 is fallback.
 */
export function getOnboardingMascotVideoSources(): OnboardingMascotVideoSource[] {
  const sources = [...localOnboardingMascotVideoSources];
  if (!onboardingMascotVideoPathOverride) return sources;

  const resolvedOverride =
    resolveMediaUrl(onboardingMascotVideoPathOverride) ?? onboardingMascotVideoPathOverride;
  if (!sources.some((source) => source.src === resolvedOverride)) {
    sources.push({ src: resolvedOverride, type: inferVideoMimeType(resolvedOverride) });
  }
  return sources;
}
