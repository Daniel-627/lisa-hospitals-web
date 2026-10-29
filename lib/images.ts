/**
 * Makes a public Cloudinary picture lighter: the right format for each browser (WebP/AVIF), automatic quality, and no
 * wider than needed. Other links, and private files, are returned unchanged.
 */
export function fit(url: string | null | undefined, width: number): string {
  if (!url) return "";
  return url.replace(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(?!f_auto)/, `$1f_auto,q_auto,c_limit,w_${width}/`);
}
