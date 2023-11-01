import parameterize from 'parameterize';

import { slugify } from './slugify';

/**
 * Returns the supplied string as a slug suitable for a URL using the vendor URLify util.
 * If the vendor util returns an empty string it will fall back to the slugify method.
 *
 * Using `parameterize`, which is a port of Django's urlify util without allow_unicode support
 * which is unused by our urlify call.
 * @see https://github.com/fyalavuz/node-parameterize/blob/master/parameterize.js
 * @see https://github.com/django/django/blob/main/django/contrib/admin/static/admin/js/urlify.js
 *
 */
export const urlify = (value: string, options = {}) => {
  // parameterize performs extra processing on the string and is more suitable
  // for creating a slug from the title, rather than sanitising a slug entered manually
  const cleaned = parameterize(value, 255);

  // if the result is blank (e.g. because the title consisted entirely removed characters),
  // fall through to the non-URLify method
  return cleaned || slugify(value, options);
};
