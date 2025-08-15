import { Controller } from '@hotwired/stimulus';

import { castArray } from '../utils/castArray';
import { debounce } from '../utils/debounce';

enum Effect {
  Enable = 'enable',
  Show = 'show',
}

enum Match {
  All = 'all', // Default
  Any = 'any',
  Nil = 'nil',
  One = 'one',
}

const EFFECT_KEYS = {
  [Effect.Enable]: {
    detailKey: 'enable',
    propertyKey: 'disabled',
  },
  [Effect.Show]: {
    detailKey: 'show',
    propertyKey: 'hidden',
  },
};

type RuleEntry = [string, string[]];

/**
 * Form control elements that can support the `disabled` attribute.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/disabled
 */
type FormControlElement =
  | HTMLButtonElement
  | HTMLFieldSetElement
  | HTMLInputElement
  | HTMLOptGroupElement
  | HTMLOptionElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

/**
 * Adds the ability for a controlled form element to conditionally
 * enable or show targeted elements based on the data from the controlled form
 * along with a set of rules to match against that data.
 *
 * @example - Enable a button if a specific value is chosen
 * ```html
 * <form data-controller="w-rules" data-action="change->w-rules#resolve">
 *   <select name="fav-drink" required>
 *     <option value="">Select a drink</option>
 *     <option value="coffee">Coffee</option>
 *     <option value="other">Other</option>
 *   </select>
 *   <button type="button" data-w-rules-target="enable" data-w-rules='{"fav-drink": ["coffee"]}'>
 *     Continue
 *   </button>
 * </form>
 * ```
 *
 * @example - Show an additional field when a select field value is chosen
 * ```html
 * <form data-controller="w-rules" data-action="change->w-rules#resolve">
 *   <select name="fav-drink" required>
 *     <option value="">Select a drink</option>
 *     <option value="coffee">Coffee</option>
 *     <option value="other">Other</option>
 *   </select>
 *   <input type="text" name="other-drink" data-w-rules-target="show" data-w-rules='{"fav-drink": ["other"]}'>
 * </form>
 * ```
 */
export class RulesController extends Controller<HTMLFormElement | FormControlElement> {
  static targets = ['enable', 'show'];

  /** Targets will be enabled if the target's rule matches the scoped form data, otherwise will be disabled. */
  declare readonly enableTargets: FormControlElement[];
  /** True if there is at least one enable target, used to ensure rules do not run if not needed. */
  declare readonly hasEnableTarget: boolean;
  /** Targets will be shown if the target's rule matches the scoped form data, otherwise will be hidden with the `hidden` attribute. */
  declare readonly showTargets: HTMLElement[];
  /** True if there is at least one show target, used to ensure rules do not run if not needed. */
  declare readonly hasShowTarget: boolean;

  declare form;
  declare rulesCache: Record<
    string,
    { match: Match; rules: [string, string[]][] }
  >;

  initialize() {
    this.rulesCache = {};
    this.resolve = debounce(this.resolve.bind(this), 50);
    this.form = this.findForm();
  }

  findForm() {
    const element = this.element;
    if (element instanceof HTMLFormElement) return element;
    if ('form' in element) return element.form;
    return element.closest('form');
  }

  /**
   * Resolve the conditional targets based on the form data and the target(s)
   * rule attributes and the controlled element's form data.
   */
  resolve() {
    if (!this.hasEnableTarget && !this.hasShowTarget) return;

    // idea - we could use filter & forEach to handle the select field special case.
    this.enableTargets.filter(this.createTargetHandler(Effect.Enable));
    this.showTargets.filter(this.createTargetHandler(Effect.Show));

    this.dispatch('resolved', { bubbles: true, cancelable: false });
  }

  /**
   * Creates a target handler for the specified effect that will
   * apply the effect to the target element based on the current state
   * of the form data and the target's rules.
   *
   * It will also dispatch an `effect` event that can be prevented
   * to stop it before the effect is applied.
   *
   * Finally, if the target is a <select> element, we will ensure
   * that the selected value is not retained if the element is disabled/hidden.
   */
  createTargetHandler(
    effect: Effect,
    { detailKey, propertyKey } = EFFECT_KEYS[effect],
  ) {
    const formData = new FormData(this.form);

    const checkFn = ([fieldName, allowedValues]) => {
      // Forms can have multiple values for the same field name
      const values = formData.getAll(fieldName);
      // Checkbox fields will NOT appear in FormData unless checked, support this when validValues are also empty
      if (allowedValues.length === 0 && values.length === 0) return true;
      return allowedValues.some((validValue) => values.includes(validValue));
    };

    const matcher: Record<Match, (rules: RuleEntry[]) => boolean> = {
      [Match.Any]: (rules) => rules.some(checkFn),
      [Match.All]: (rules) => rules.every(checkFn),
      [Match.Nil]: (rules) => rules.length === 0 || !rules.some(checkFn),
      [Match.One]: (rules) => rules.filter(checkFn).length === 1,
    };

    return (target: Element) => {
      const { match, rules } = this.parseRules(target, effect);
      const result = matcher[match](rules);

      if (result === !target[propertyKey]) return;

      const event = this.dispatch('effect', {
        bubbles: true,
        cancelable: true,
        detail: { effect, [detailKey]: result },
        target,
      });

      if (event.defaultPrevented) return;

      target[propertyKey] = !result;

      // special handling of select fields to avoid selected values from being kept as selected
      if (!result && target instanceof HTMLOptionElement && target.selected) {
        const select = target.closest('select');
        if (!select) return;

        const resetValue =
          Array.from(select.options).find((option) => option.defaultSelected)
            ?.value || '';

        const currentValue = select.value;

        if (currentValue === resetValue) return;

        select.value = resetValue;

        // dispatch change event (on select)
        this.dispatch('change', {
          prefix: '',
          target: select,
          bubbles: true,
          cancelable: false,
        });
      }
    };
  }

  /**
   * Finds & parses the rules for the provided target by the rules attribute,
   * which is determined via the identifier and the provided effect name,
   * (e.g. `data-w-rules-enable`). Falling back to the generic attribute
   * if not found (e.g. `data-w-rules`).
   *
   * With the found rules, check the rules cache first,
   * then parse the rules for caching if not found.
   *
   * When parsing the rule, assume an `Object.entries` format or convert an
   * object to this format. Then ensure each value is an array of strings
   * for consistent comparison to FormData values.
   *
   * Support an override of the match value, via a rule entry with a string that
   * is an empty string, as this will not be a valid field `name`.
   */
  parseRules(target: Element, effect: Effect = Effect.Enable) {
    const emptyRules = { match: Match.All, rules: [] };
    if (!target) return emptyRules;

    let attribute = `data-${this.identifier}-${effect}`;
    let rulesRaw = target.getAttribute(attribute);

    if (!rulesRaw) {
      attribute = `data-${this.identifier}`;
      rulesRaw = target.getAttribute(attribute);
    }

    if (!rulesRaw) return emptyRules;

    const cachedRule = this.rulesCache[rulesRaw];
    if (cachedRule) return cachedRule;

    let parsedRules;

    try {
      parsedRules = JSON.parse(rulesRaw);
    } catch (error) {
      this.context.handleError(
        error,
        `Unable to parse rule at the attribute '${attribute}'.`,
      );
      return emptyRules;
    }

    const rules = (
      Array.isArray(parsedRules) ? parsedRules : Object.entries(parsedRules)
    )
      .filter(Array.isArray)
      .map(([fieldName = '', validValues = ''] = []) => [
        fieldName,
        castArray(validValues).map(String),
      ]) as RuleEntry[];

    const [, [match = Match.All] = []] =
      rules.find(([key]) => key === '') || [];

    if (!Object.values(Match).includes(match as Match)) {
      this.context.handleError(
        new Error(`Invalid match value: '${match}'.`),
        `Match value must be one of: '${Object.values(Match).join("', '")}'.`,
      );
      return emptyRules;
    }

    const newRules = {
      match: match as Match,
      rules: rules.filter(([key]) => key),
    };

    this.rulesCache[rulesRaw] = newRules;

    return newRules;
  }

  /* Target disconnection & reconnection */

  enableTargetConnected() {
    this.resolve();
  }

  enableTargetDisconnected() {
    this.resolve();
  }

  showTargetConnected() {
    this.resolve();
  }

  showTargetDisconnected() {
    this.resolve();
  }
}
