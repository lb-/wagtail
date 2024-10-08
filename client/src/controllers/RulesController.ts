import { Controller } from '@hotwired/stimulus';

import { debounce } from '../utils/debounce';

/**
 * Adds the ability for a controlled form element to conditionally
 * enable targeted elements based on the data from the controlled form
 * along with a set of rules to match against that data.
 *
 * @example - Enable a button if a value is chosen
 * <form data-controller="w-rules" data-action="change->w-rules#resolve">
 *   <select name="fav-drink" required>
 *     <option value="">Select a drink</option>
 *     <option value="coffee">Coffee</option>
 *     <option value="other">Other</option>
 *   </select>
 *   <button type="button" data-w-rules-target="enable" data-rule='{"fav-drink": ["coffee"]}'>
 *     Continue
 *   </button>
 * </form>
 *
 */
export class RulesController extends Controller<HTMLFormElement> {
  static targets = ['enable'];

  /** Targets will be enabled if the `data-rule` matches the scoped form data, otherwise will be disabled. */
  declare readonly enableTargets: HTMLElement[];
  /** Value set on connect to ensure there are valid targets available, to avoid running rules when not needed. */
  declare readonly hasEnableTarget: boolean;

  declare active: boolean;
  declare ruleCache: Record<string, Record<string, string[]>>;

  initialize() {
    this.ruleCache = {};
    this.resolve = debounce(this.resolve.bind(this), 50);
  }

  connect() {
    this.checkTargets();
  }

  /**
   * Checks for any targets that will mean that the controller needs to be active.
   */
  checkTargets() {
    this.active = this.hasEnableTarget;
  }

  /**
   * Resolve the conditional targets based on the form data and the target(s)
   * `data-rule` attributes.
   */
  resolve() {
    if (!this.active) return;

    const formData = new FormData(this.element);

    this.enableTargets.forEach((target) => {
      const shouldEnable = Object.entries(this.getRule(target)).every(
        ([fieldName, validValues]) => {
          const fieldValues = formData.getAll(fieldName);
          return validValues.some((validValue) =>
            fieldValues.includes(validValue),
          );
        },
      );

      if (shouldEnable === target.hasAttribute('disabled')) return;

      if (shouldEnable) {
        target.removeAttribute('disabled');
      } else {
        target.setAttribute('disabled', '');
      }
    });

    this.dispatch('resolved', { bubbles: true, cancelable: false });
  }

  getRule(target: Element): Record<string, string[]> {
    if (!target) return {};
    const ruleStr = target.getAttribute('data-rule');
    if (!ruleStr) return {};

    // check cache
    const cachedRule = this.ruleCache[ruleStr];
    if (cachedRule) return cachedRule;

    // parse rule data, assume it' correctly formatted & let Stimulus handle errors & logging
    const parsedRule = JSON.parse(ruleStr);

    const rule = Array.isArray(parsedRule)
      ? Object.fromEntries(parsedRule)
      : parsedRule;

    this.ruleCache[ruleStr] = rule;

    return rule;
  }

  enableTargetDisconnected() {
    this.checkTargets();
  }

  enableTargetConnected() {
    this.active = true;
    this.resolve();
  }
}
