/** Resolve public assets for root hosting, GitHub Pages and portable builds. */
export function publicAssetUrl(path: string, base = import.meta.env?.BASE_URL ?? '/') {
  return `${base.endsWith('/') ? base : `${base}/`}${path.replace(/^\/+/, '')}`;
}
