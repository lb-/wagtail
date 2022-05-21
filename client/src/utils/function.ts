/**
 * Useful generic toolkit functions.
 */

/**
 * Returns the value of the first argument. All others are ignored.
 *
 * @example
 * identity(7, 8, 9)
 * // 7
 */
export function identity<T extends any[]>(...args: T): T[0] {
  return args[0];
}
