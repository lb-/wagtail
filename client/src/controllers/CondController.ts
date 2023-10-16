import { Controller } from '@hotwired/stimulus';

import { castArray } from '../utils/castArray';

/**
 * Adds the ability for a controlled form element to conditionally
 * show/hide or enable/disable targeted elements based on the form data.
 *
 * @example - Show an additional checkbox if a value is not chosen
 * <form data-controller="w-cond" data-action="change->w-cond#resolve">
 *   <input type="radio" name="drink" value="coffee" />
 *   <input type="radio" name="drink" value="tea" />
 *   <input type="radio" name="drink" value="milo" />
 *   <input type="checkbox" id="confirm" name="confirm" data-w-cond-target="hide" data-match='{"drink": "coffee"}' />
 * </form>
 *
 * @example - Show an additional checkbox if a value is chosen
 * <form data-controller="w-cond" data-action="change->w-cond#resolve">
 *   <select name="fav-drink" required>
 *     <option value="">Select a drink</option>
 *     <option value="coffee">Coffee</option>
 *     <option value="other">Other</option>
 *   </select>
 *   <input type="text" name="other-drink" data-w-cond-target="show" data-match='{"fav-drink": ["other"]}'>
 * </form>
 *
 */
export class CondController extends Controller<HTMLFormElement> {
  static targets = ['disable', 'enable', 'hide', 'show'];

  static values = {
    active: { default: false, type: Boolean },
    persist: { default: false, type: Boolean },
  };

  /** Targets will be disabled if the `data-match` matches the scoped form data, otherwise will be enabled. */
  declare readonly disableTargets: HTMLElement[];
  /** Targets will be enabled if the `data-match` matches the scoped form data, otherwise will be disabled. */
  declare readonly enableTargets: HTMLElement[];
  /** Targets will be hidden if the `data-match` matches the scoped form data, otherwise will be shown. */
  declare readonly hideTargets: HTMLElement[];
  /** Targets will be shown if the `data-match` matches the scoped form data, otherwise will be hidden. */
  declare readonly showTargets: HTMLElement[];

  /** Allows the behavior to be stopped/started to avoid unnecessary checks. */
  declare activeValue: boolean;
  /** If true, the controller will persist in the DOM if no targets exist on connect
   * or after all are removed. Otherwise, the controller will remove it's attributes from the DOM. */
  declare persistValue: boolean;

  declare matchCache: Record<string, Record<string, string[]>>;

  initialize() {
    this.matchCache = {};
  }

  connect() {
    this.checkTargets();
  }

  /**
   * Checks for any targets that will mean that the controller needs to be active.
   * Lazily checks all targets to avoid DOM thrashing.
   */
  checkTargets() {
    const anyTargetsExist = [
      () => this.disableTargets,
      () => this.enableTargets,
      () => this.hideTargets,
      () => this.showTargets,
    ].some((fn) => fn().length > 0);
    if (!this.persistValue && !anyTargetsExist) {
      const identifier = this.identifier;
      const { controllerAttribute } = this.application.schema;
      const cleanedAttribute = (
        this.element.getAttribute(controllerAttribute) || ''
      ).replace(identifier, '');
      this.element.setAttribute(controllerAttribute, cleanedAttribute);
      return;
    }
    this.activeValue = anyTargetsExist;
  }

  /**
   * Resolve the conditional targets based on the form data and the targets'
   * `data-match` attributes.
   */
  resolve() {
    if (!this.activeValue) return;
    const form = this.element;
    const formData = Object.fromEntries(new FormData(form).entries());

    [
      ...this.enableTargets.map((target) => ({ shouldDisable: false, target })),
      ...this.disableTargets.map((target) => ({ shouldDisable: true, target })),
    ].forEach(({ shouldDisable, target }) => {
      const isMatch = this.getIsMatch(formData, this.getMatchData(target));
      this.toggleAttribute(
        target,
        shouldDisable ? isMatch : !isMatch,
        'disabled',
      );
    });

    [
      ...this.hideTargets.map((target) => ({ shouldHide: true, target })),
      ...this.showTargets.map((target) => ({ shouldHide: false, target })),
    ].forEach(({ shouldHide, target }) => {
      const isMatch = this.getIsMatch(formData, this.getMatchData(target));
      this.toggleAttribute(target, shouldHide ? isMatch : !isMatch);
    });

    this.dispatch('resolved', { bubbles: true, cancelable: false });
  }

  getIsMatch(
    formData: Record<string, FormDataEntryValue>,
    matchData: Record<string, string[]>,
  ): boolean {
    return (
      matchData &&
      Object.entries(matchData).every(([key, value]) =>
        value.includes(String(formData[key] || '')),
      )
    );
  }

  getMatchData(target: Element): Record<string, string[]> {
    if (!target) return {};
    const matchStr = target.getAttribute('data-match');
    if (!matchStr) return {};

    // check cache
    const cachedMatch = this.matchCache[matchStr];
    if (cachedMatch) return cachedMatch;

    // prepare match data
    let match = {};

    if (matchStr) {
      try {
        match = JSON.parse(matchStr);
        if (Array.isArray(match)) match = Object.fromEntries(match);
      } catch (e) {
        // Safely ignore JSON parsing errors
      }
    }

    // Map through values and convert to array of strings
    const matchData = Object.fromEntries(
      Object.entries(match).map(([key, value]) => [
        key,
        castArray(value).map(String),
      ]),
    );

    // eslint-disable-next-line no-param-reassign
    this.matchCache[matchStr] = matchData;

    return matchData;
  }

  toggleAttribute(target, shouldRemove = false, attr = 'hidden') {
    if (shouldRemove) {
      target.setAttribute(attr, attr);
    } else {
      target.removeAttribute(attr);
    }

    if (shouldRemove && target instanceof HTMLOptionElement) {
      const selectElement = target.closest('select');
      if (selectElement && target.selected) {
        if (selectElement && target.selected) {
          selectElement.value =
            Array.from(selectElement.options).find(
              (option) => option.defaultSelected,
            )?.value || '';
          // intentionally not dispatching a change event, could cause an infinite loop
          this.dispatch('cleared', {
            target: selectElement,
            bubbles: true,
          });
        }
      }
    }
  }

  enableTargetDisconnected() {
    this.checkTargets();
  }

  enableTargetConnected() {
    this.activeValue = true;
    this.resolve();
  }

  disableTargetDisconnected() {
    this.checkTargets();
  }

  disableTargetConnected() {
    this.activeValue = true;
    this.resolve();
  }

  hideTargetDisconnected() {
    this.checkTargets();
  }

  hideTargetConnected() {
    this.activeValue = true;
    this.resolve();
  }

  showTargetDisconnected() {
    this.checkTargets();
  }

  showTargetConnected() {
    this.activeValue = true;
    this.resolve();
  }
}
