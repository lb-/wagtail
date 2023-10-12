import { Controller } from '@hotwired/stimulus';

import { debounce } from '../utils/debounce';

/**
 * Adds ability to sync the value or interactions with one input with one
 * or more targeted other inputs.
 *
 * @example
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
 */
export class SyncController extends Controller<
  HTMLInputElement | HTMLSelectElement
> {
  static values = {
    debounce: { default: 100, type: Number },
    delay: { default: 0, type: Number },
    disabled: { default: false, type: Boolean },
    quiet: { default: false, type: Boolean },
    source: String,
    target: String,
  };

  declare debounceValue: number;
  declare delayValue: number;
  declare disabledValue: boolean;
  declare quietValue: boolean;
  /** Selector string for the elements to be used as a source for this sync behaviour. */
  declare sourceValue: string;
  /** Selector string for the element to be targeted by this sync behaviour. */
  declare targetValue: string;

  /**
   * Dispatches an event to all target elements so that they can be notified
   * that a sync has started, allowing them to disable the sync by preventing
   * default.
   */
  connect() {
    this.processElements('start', true);
    this.apply = debounce(this.apply.bind(this), this.debounceValue);
  }

  /**
   * Allows for targeted elements to determine, via preventing the default event,
   * whether this sync controller should be disabled.
   */
  check() {
    this.processElements('check', true);
  }

  /**
   * Applies a value from the controlled element to the targeted
   * elements. Calls to this method are debounced based on the
   * controller's `debounceValue`.
   *
   * Applying of the value to the targets can be done with a delay,
   * based on the controller's `delayValue`.
   */
  apply(event?: Event & { params?: { apply?: string } }) {
    const valueToApply = event?.params?.apply || this.element.value;

    const applyValue = (target) => {
      /* use setter to correctly update value in non-inputs (e.g. select) */ // eslint-disable-next-line no-param-reassign
      target.value = valueToApply;

      if (this.quietValue) return;

      this.dispatch('change', {
        cancelable: false,
        prefix: '',
        target,
      });
    };

    this.processElements('apply').forEach((target) => {
      if (this.delayValue) {
        setTimeout(() => {
          applyValue(target);
        }, this.delayValue);
      } else {
        applyValue(target);
      }
    });
  }

  /**
   * Clears the value of the targeted elements.
   */
  clear() {
    this.processElements('clear').forEach((target) => {
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
   * Applies a filtering to the targeted elements based on the value/option
   * selected in the controlled element.
   */
  filterOld(event) {
    const values = Array.from(
      (this.element as HTMLSelectElement).selectedOptions,
    )
      .flatMap((option) => {
        let value = [];
        try {
          value = Array.from(
            JSON.parse(
              option.getAttribute(`data-${this.identifier}-filter-param`) ||
                `[${option.value}]`,
            ),
          );
        } catch (error) {
          // ignore error
        }
        return value;
      })
      .map((value) => `${value}`)
      .filter(Boolean);

    console.log('FILTER', {
      event,
      values,
      value: (this.element as HTMLSelectElement).selectedOptions,
    });

    this.processElements('filter').forEach((target) => {
      if (target instanceof HTMLSelectElement) {
        Array.from(target.options).forEach((option) => {
          if (!option.value) return;
          if (values.includes(option.value) || values.length === 0) {
            option.removeAttribute('hidden');
          } else {
            if (option.selected) {
              // eslint-disable-next-line no-param-reassign
              target.value = '';
            }
            option.setAttribute('hidden', '');
          }
        });
      }
    });
  }

  filter(event) {
    const elements = this.processElements('filter');
    if (this.sourceValue && !elements.includes(this.element)) {
      return;
    }
    console.log('event', event);
    // the event will be triggered globally, so we need to ensure that it is the event
    // we care about (on the source elements only)
    // in which case, this works in reverse of all the others

    const element = this.element;
    if (!(element instanceof HTMLSelectElement)) return;
    const values = Array.from(element.options)
      .flatMap((option) => {
        // the option we care about is the one from the event.target!
        // again we will need to parse the values every single time. for every single option.
        let value = [];
        try {
          value = Array.from(
            JSON.parse(
              option.getAttribute(`data-${this.identifier}-filter-param`) ||
                `[${option.value}]`,
            ),
          );
        } catch (error) {
          // ignore error
        }
        return value;
      })
      .map((value) => `${value}`)
      .filter(Boolean);

    // values e.g. ['1', '2', '3']
  }

  /**
   * Simple method to dispatch a ping event to the targeted elements.
   */
  ping() {
    this.processElements('ping', false, { bubbles: true });
  }

  /**
   * Returns the non-default prevented elements that are targets or the source
   * of this sync controller. Additionally allows this processing to enable
   * or disable this controller instance's sync behaviour.
   */
  processElements(eventName: string, resetDisabledValue = false, options = {}) {
    const selector = this.targetValue || this.sourceValue;
    if ((!resetDisabledValue && this.disabledValue) || !selector) {
      return [];
    }

    const selectedElements = Array.from(
      document.querySelectorAll<HTMLElement>(selector),
    );

    const elements = selectedElements.filter((target) => {
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
      this.disabledValue = selectedElements.length > elements.length;
    }

    return elements;
  }
}
