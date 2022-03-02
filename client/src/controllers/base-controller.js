import { Controller } from '@hotwired/stimulus';

const registry = [];

/**
 *
 * @param {string} name
 * @param {{prefix: String}} options
 * @returns {string?}
 */
const getIdentifier = (name, { prefix = 'w' } = {}) => {
  const cleanName = name.replace(/[cC]ontroller$/, '');
  if (name) {
    const kebabCaseName = cleanName
      .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
      .toLowerCase();
    return prefix ? [prefix, kebabCaseName].join('') : kebabCaseName;
  }
  return null;
};

/**
 * core base controller to keep any specific logic that is desired.
 */
export class BaseController extends Controller {
  /**
   *
   * Note: `this` will be the controller if called on a class that
   * extends BaseController.
   *
   * @param {Function?} controller
   * @param {string?} name
   * @returns
   */
  static initRegister = function initRegister(name = null, controller = this) {
    if (typeof controller !== 'function') return;
    const identifier = getIdentifier(name || controller.name);
    if (registry.includes(identifier)) return;
    registry.push(identifier);

    document.addEventListener(
      'wagtail:stimulus-init',
      ({ detail: { register } }) => {
        register(identifier, controller);
      },
      { capture: true, once: true, passive: true },
    );
  };
}
