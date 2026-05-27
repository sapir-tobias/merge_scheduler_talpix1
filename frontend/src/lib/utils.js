import { clsx } from 'clsx'

/**
 * Join class names conditionally. With CSS Modules the inputs are already
 * unique hashed class names, so plain clsx is sufficient (no tailwind-merge).
 */
export function cn(...inputs) {
  return clsx(inputs)
}
