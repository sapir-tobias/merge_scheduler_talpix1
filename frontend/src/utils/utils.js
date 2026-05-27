/**
 * Join truthy class names into a space-separated string. CSS Modules already
 * produce unique hashed names, so a plain join is sufficient — no external
 * class-name library (matches Talpix, which ships none).
 */
export function cn(...inputs) {
  return inputs.filter(Boolean).join(' ')
}
