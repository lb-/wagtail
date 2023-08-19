/**
 * Delays invoking `func` until after `wait` milliseconds have elapsed.
 * If wait is provided as a non-number value the function will be invoked
 * immediately. Any additional arguments are provided to `func` when it's invoked.
 * Returns a promise that resolves with the result of the invoked `func`.
 */
export const delay = (
  fn: { (...args: any[]): any },
  wait: number | null | false | undefined = null,
  ...args: any[]
) => {
  if (typeof wait !== 'number' || Number.isNaN(wait)) {
    return Promise.resolve(fn(...args));
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(fn(...args));
    }, wait);
  });
};
