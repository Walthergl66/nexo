const SUPABASE_PUBLIC_MARKER = '/storage/v1/object/public/';
const SUPABASE_RENDER_PREFIX = '/storage/v1/render/image/public/';

/**
 * Supabase Image Transformations are a paid (Pro plan) feature. They stay OFF
 * unless EXPO_PUBLIC_SUPABASE_IMAGE_TRANSFORM is explicitly enabled, so free-tier
 * projects load the original image directly instead of paying for a failed
 * render request before falling back.
 */
const TRANSFORM_ENABLED = ['1', 'true', 'yes'].includes(
  (process.env.EXPO_PUBLIC_SUPABASE_IMAGE_TRANSFORM ?? '').trim().toLowerCase(),
);

/**
 * Rewrites a Supabase public object URL into its on-the-fly image transformation
 * URL (resized/compressed by Supabase). Returns null when transformations are
 * disabled or the URL is not a transformable Supabase public URL, so callers can
 * fall back to the original image.
 */
export function buildSupabaseThumbnailUrl(
  url: string | null | undefined,
  options: { width: number; quality?: number },
): string | null {
  if (!TRANSFORM_ENABLED || !url) {
    return null;
  }

  const markerIndex = url.indexOf(SUPABASE_PUBLIC_MARKER);

  if (markerIndex === -1) {
    return null;
  }

  const base = url.slice(0, markerIndex);
  const objectPath = url.slice(markerIndex + SUPABASE_PUBLIC_MARKER.length);
  const [cleanPath] = objectPath.split('?');

  if (!cleanPath) {
    return null;
  }

  const width = Math.max(1, Math.round(options.width));
  const params = [`width=${width}`];

  if (options.quality) {
    params.push(`quality=${Math.max(1, Math.min(100, Math.round(options.quality)))}`);
  }

  return `${base}${SUPABASE_RENDER_PREFIX}${cleanPath}?${params.join('&')}`;
}
