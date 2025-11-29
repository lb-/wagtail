/**
 * Serializes a form element into a URL-encoded string.
 * This is a vanilla JS replacement for jQuery's .serialize() method.
 *
 * @param form - The form element to serialize
 * @returns A URL-encoded string of the form's field names and values
 */
const encodeForm = (form: HTMLFormElement): string =>
  new URLSearchParams(
    new FormData(form) as unknown as Record<string, string>,
  ).toString();

export { encodeForm };
