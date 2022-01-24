/**
 * Converts a a string (e.g. UpgradeNotification) to a kebab-case string
 * with a prefix (e.g. 'w-upgrade-controller').
 *
 * @param {string} name
 * @param {{prefix: String}} options
 * @returns {string?}
 *
 * @example
 * getKebabCaseIdentifier('someSpecialValue');
 * // returns 'w-some-special-value'
 *
 */
const getKebabCaseIdentifier = (name, { prefix = 'w' } = {}) => {
  if (!name) return null;
  const kebabCaseName = name
    .replace(/((?<=[a-z\d])[A-Z]|(?<=[A-Z\d])[A-Z](?=[a-z]))/g, '-$1')
    .toLowerCase();

  return prefix ? [prefix, kebabCaseName].join('-') : kebabCaseName;
};

export default getKebabCaseIdentifier;
