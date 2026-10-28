// Product photo rules shared by the admin form and the server actions.
export const IMAGE_MAX_BYTES = 3 * 1024 * 1024;
export const IMAGE_MAX_LABEL = "3 ميجابايت";
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
export const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

/** Public URL used to serve a stored product photo. */
export function materialImagePath(id: string, version?: number): string {
  const base = `/api/materials/${id}/image`;
  return version ? `${base}?v=${version}` : base;
}
