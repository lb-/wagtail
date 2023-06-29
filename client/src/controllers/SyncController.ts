import { Controller } from '@hotwired/stimulus';

import { debounce } from '../utils/debounce';

/**
 * Adds ability to sync the value or interactions with one input with one
 * or more targeted other inputs.
 *
 * @example - Applying the value from a controlled input to a target input
 * <section>
 *   <input type="text" name="title" id="title" />
 *   <input
 *     type="date"
 *     id="event-date"
 *     name="event-date"
 *     value="2025-07-22"
 *     data-controller="w-sync"
 *     data-action="change->w-sync#apply cut->w-sync#clear focus->w-sync#check"
 *     data-w-sync-target-value="#title"
 *   />
 * </section>
 *
 * @example - Adopting the values from multiple inputs to a controlled input
 * <section>
 *   <input type="text" name="title" id="title" value="Party" />
 *   <input type="date" name="date" id="date" value="2027-01-03" />
 *   <input
 *     type="text"
 *     id="summary"
 *     name="summary"
 *     value="Party on 2027-01-03"
 *     data-controller="w-sync"
 *     data-action="w-sync:connected->w-sync#adopt change@document->w-sync#adopt"
 *     data-w-sync-param-join=" on "
 *     data-w-sync-source-value="#title, #date"
 *   />
 * </section>
 */
export class SyncController extends Controller<HTMLInputElement> {
  static values = {
    blockSource: { default: false, type: Boolean },
    blockTarget: { default: false, type: Boolean },
    debounce: { default: 100, type: Number },
    delay: { default: 0, type: Number },
    quiet: { default: false, type: Boolean },
    source: { default: '', type: String },
    target: { default: '', type: String },
  };

  declare blockSourceValue: boolean;
  declare blockTargetValue: boolean;
  declare debounceValue: number;
  declare delayValue: number;
  declare quietValue: boolean;
  declare readonly sourceValue: string;
  declare readonly targetValue: string;

  /**
   * Dispatches an event to all target elements so that they can be notified
   * that a sync has started, allowing them to disable the sync by preventing
   * default.
   */
  connect() {
    this.adopt = debounce(this.adopt.bind(this), this.debounceValue);
    this.apply = debounce(this.apply.bind(this), this.debounceValue);

    this.processSourceElements('start', true);
    this.processTargetElements('start', true);

    this.dispatch('connected', {
      bubbles: false,
      cancelable: false,
      detail: {},
    });
  }

  /**
   * Allows for targeted elements to determine, via preventing the default event,
   * whether this sync controller should be disabled.
   */
  check() {
    this.processSourceElements('check', true);
    this.processTargetElements('check', true);
  }

  /**
   * Adopts the value of source elements to be used as the value of
   * the controlled element.
   */
  adopt(event?: CustomEvent & { params?: { force: boolean; join?: string } }) {
    const sourceElements = this.processSourceElements('adopt');

    // due to the way we will use event listeners, we want to
    // avoid checking for updated values unless the event was fired
    // from the controlled element, or the known source elements
    if (
      !event?.params?.force &&
      event?.target instanceof Element &&
      ![this.element, ...sourceElements].includes(event.target)
    ) {
      return;
    }

    const values = sourceElements
      .map(this.getValue)
      .map(String)
      .filter(Boolean);

    const joinValue = event?.params?.join || '';

    const currentValue = this.element.value;
    const newValue = values.join(joinValue);

    if (currentValue === newValue) return;

    this.maybeDelay().then(() => {
      this.element.value = newValue;

      if (this.quietValue) return;

      this.dispatch('change', { prefix: '', cancelable: false });
    });
  }

  /**
   * Applies a value from the controlled element to the targeted
   * elements. Calls to this method are debounced based on the
   * controller's `debounceValue`.
   *
   * Applying of the value to the targets can be done with a delay,
   * based on the controller's `delayValue`.
   * NOTE: REWORD - only applicable to target elements.
   */
  apply(event?: Event & { params?: { apply?: string } }) {
    const valueToApply = event?.params?.apply || this.element.value;

    this.processTargetElements('apply').forEach((element) => {
      const target = element as HTMLInputElement;

      this.maybeDelay().then(() => {
        /* use setter to correctly update value in non-inputs (e.g. select) */ // eslint-disable-next-line no-param-reassign
        target.value = valueToApply;

        if (this.quietValue) return;

        this.dispatch('change', {
          cancelable: false,
          prefix: '',
          target,
        });
      });
    });
  }

  /**
   * Clears the value of the targeted elements.
   * Not applicable to source targets ???
   * NOTE: REWORD - only applicable to target elements?
   */
  clear() {
    this.processTargetElements('clear').forEach((target) => {
      setTimeout(() => {
        target.setAttribute('value', '');
        if (this.quietValue) return;
        this.dispatch('change', {
          cancelable: false,
          prefix: '',
          target: target as HTMLInputElement,
        });
      }, this.delayValue);
    });
  }

  /**
   * Simple method to dispatch a ping event to the targeted elements.
   */
  ping() {
    this.processSourceElements('ping', false, { bubbles: true });
    this.processTargetElements('ping', false, { bubbles: true });
  }

  /**
   * Returns the non-default prevented elements that are sources for this
   * controlled field's value.
   */
  processSourceElements(
    eventName: string,
    resetDisabledValue = false,
    options = {},
  ) {
    const sourceValue = this.sourceValue;

    if ((!resetDisabledValue && this.blockSourceValue) || !this.sourceValue) {
      return [];
    }

    // split by comma to better align with the selector implied value
    // instead of the DOM ordering value
    // so that '#field-2, #field-1' would return in selector order, not DOM order
    // order matters here as we will be joining the values
    const foundElements = sourceValue
      .split(',')
      .flatMap((selector) => [...document.querySelectorAll(selector)]);

    const filteredElements = foundElements.filter((target) => {
      const event = this.dispatch(eventName, {
        bubbles: false,
        cancelable: true,
        ...options, // allow overriding some options but not detail & target
        detail: { element: this.element, source: true }, // not sure on this (need a way to know if this is source or target?)
        target: target as HTMLInputElement,
      });

      return !event.defaultPrevented;
    });

    if (resetDisabledValue) {
      this.blockSourceValue = foundElements.length > filteredElements.length;
    }

    return foundElements;
  }

  /**
   * Returns the non-default prevented elements that are targets of this sync
   * controller. Additionally allows this processing to enable or disable
   * this controller instance's sync behaviour.
   */
  processTargetElements(
    eventName: string,
    resetDisabledValue = false,
    options = {},
  ) {
    if ((!resetDisabledValue && this.blockTargetValue) || !this.targetValue) {
      return [];
    }

    const foundElements = [
      ...document.querySelectorAll<HTMLElement>(this.targetValue),
    ];

    const filteredElements = foundElements.filter((target) => {
      const event = this.dispatch(eventName, {
        bubbles: false,
        cancelable: true,
        ...options, // allow overriding some options but not detail & target
        detail: { element: this.element, value: this.element.value },
        target: target as HTMLInputElement,
      });

      return !event.defaultPrevented;
    });

    if (resetDisabledValue) {
      this.blockTargetValue = foundElements.length > filteredElements.length;
    }

    return filteredElements;
  }

  /**
   * Resolves a value from any kind of input (WIP)
   * Not sure if we should also attempt to read innerText?
   *
   * @param element
   * @returns
   */
  getValue(element: Node) {
    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox') return `${!!element.checked}`;
      return element.value;
    }

    if (element instanceof HTMLTextAreaElement) return element.value;

    if (element instanceof HTMLSelectElement) {
      return element.options[element.selectedIndex].value;
    }

    return '';
  }

  /**
   * Helper method to wrap a potential delay in a Promise, returns
   * a thenable Promise like object.
   */
  maybeDelay() {
    return this.delayValue
      ? new Promise((resolve) => {
          setTimeout(resolve, this.delayValue);
        })
      : { then: (callback: () => void) => callback() };
  }
}
