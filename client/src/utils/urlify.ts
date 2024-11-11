import config from './urlify.config.json';

const cache = {};

const createTransliterateFn = (locale = '') => {
  if (cache[locale]) return cache[locale];

  // prepare the language part of the locale for comparison only
  const [languageCode] = locale.toLowerCase().split('-');

  const downcodeMapping = Object.fromEntries(
    config
      .map((item) => Object.entries(item))
      .flat()
      // with the key being split by :, removing the first item.
      .map(([key, value]) => {
        const [, ...languageCodes] = key.toLowerCase().split(':');
        return [languageCodes, value];
      })
      // if the first item starts with the language code, then order LAST (so that it overrides values)
      .sort(([languageCodes = []] = []) =>
        (languageCodes as string[]).includes(languageCode) ? -1 : 0,
      )
      .flatMap(([, values]) => values), // todo check support for flatMap support in browsers
  );

  const regex = new RegExp(Object.keys(downcodeMapping).join('|'), 'g');

  const fn = (str) => str.replace(regex, (item) => downcodeMapping[item]);
  cache[languageCode] = fn;

  return fn;
};

/**
 * This util and the mapping is a refined port Django's urlify.js util,
 * without the need for a full Regex polyfill implementation and better handling of
 * different source languages.
 *
 * @see https://github.com/django/django/blob/main/django/contrib/admin/static/admin/js/urlify.js
 */
export const urlify = (
  originalStr: string,
  {
    allowUnicode = false,
    locale = 'en',
    numChars = 255,
  }: {
    allowUnicode?: boolean;
    locale?: string;
    numChars?: number;
  } = {},
) => {
  let str = originalStr;
  // changes, e.g., "Petty theft" to "petty-theft"
  if (!allowUnicode) {
    str = createTransliterateFn(locale)(str);
  }
  str = str.toLowerCase(); // convert to lowercase
  // if downcode doesn't hit, the char will be stripped here
  if (allowUnicode) {
    // Keep Unicode letters including both lowercase and uppercase
    // characters, whitespace, and dash; remove other characters.
    str = str.replace(/[^-_\p{L}\p{N}\s]/gu, '');
  } else {
    str = str.replace(/[^-\w\s]/g, ''); // remove unneeded chars
  }
  str = str.replace(/^\s+|\s+$/g, ''); // trim leading/trailing spaces
  str = str.replace(/[-\s]+/g, '-'); // convert spaces to hyphens
  str = str.substring(0, numChars); // trim to first num_chars chars
  str = str.replace(/-+$/g, ''); // trim any trailing hyphens
  return str;
};
