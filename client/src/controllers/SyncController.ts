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
export class SyncController extends Controller<HTMLInputElement> {
  static values = {
    debounce: { default: 100, type: Number },
    delay: { default: 0, type: Number },
    disabled: { default: false, type: Boolean },
    normalize: { default: false, type: Boolean },
    quiet: { default: false, type: Boolean },
    ref: { default: '', type: String },
    target: { default: '', type: String },
  };

  /**
   * The delay, in milliseconds, to wait before running apply if called multiple
   * times consecutively.
   */
  declare debounceValue: number;
  /**
   * The delay, in milliseconds, to wait before applying the value to the target elements.
   */
  declare delayValue: number;
  /**
   * If true, the sync controller will not apply the value to the target elements.
   * Dynamically set when there are no valid target elements to sync with or
   * when all target elements have the apply event prevented.
   */
  declare disabledValue: boolean;
  /**
   * If true, the value to sync will be normalized.
   * @example If the value is a file path, the normalized value will be the file name.
   */
  declare normalizeValue: boolean;
  /**
   * If true, the value will be set on the target elements without dispatching a change event.
   */
  declare quietValue: boolean;
  /**
   * A reference value to support differentiation between events.
   */
  declare refValue: boolean;

  declare readonly targetValue: string;

  /**
   * Dispatches an event to all target elements so that they can be notified
   * that a sync has started, allowing them to disable the sync by preventing
   * default.
   */
  connect() {
    this.processTargetElements('start', { resetDisabledValue: true });
    this.apply = debounce(this.apply.bind(this), this.debounceValue);
  }

  /**
   * Allows for targeted elements to determine, via preventing the default event,
   * whether this sync controller should be disabled.
   */
  check() {
    this.processTargetElements('check', { resetDisabledValue: true });
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
    // valueToApply is the value to apply to the target elements - ARG this should be normalized
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

    this.processTargetElements('apply').forEach((target) => {
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
    this.processTargetElements('ping');
  }

  /**
   * Returns the non-default prevented elements that are targets of this sync
   * controller. Additionally allows this processing to enable or disable
   * this controller instance's sync behaviour.
   */
  processTargetElements(
    eventName: string,
    { resetDisabledValue = false } = {},
  ) {
    if (!resetDisabledValue && this.disabledValue) {
      return [];
    }

    const targetElements = [
      ...document.querySelectorAll<HTMLElement>(this.targetValue),
    ];

    const elements = targetElements.filter((target) => {
      const element = this.element;
      const valueRaw = element.value;
      const ref = this.refValue;

      // this wont work as the value set is in the apply method
      const value =
        element.type === 'file'
          ? valueRaw
              .split('\\')
              .slice(-1)[0]
              .replace(/\.[^.]+$/, '')
          : valueRaw;

      const maxLength = Number(target.getAttribute('maxlength')) || null;
      const required = !!target.hasAttribute('required');

      /** need a way to support legacy event approach */

      const event = this.dispatch(eventName, {
        bubbles: true,
        cancelable: true,
        detail: {
          element,
          maxLength,
          ref,
          required,
          value,
          valueRaw,
        },
        target: target as HTMLInputElement,
      });

      console.log(event);

      return !event.defaultPrevented;
    });

    if (resetDisabledValue) {
      this.disabledValue = targetElements.length > elements.length;
    }

    return elements;
  }

  /**
   * Could use afterload or something to add backwards compatibility with documented
   * 'wagtail:images|documents-upload' approach.
   */
  static afterLoad(identifier: string) {
    console.log('is this working?', { identifier });
    if (identifier !== 'w-sync') return;

    // domReady().then(() => {
    console.log('is this working?');

    /**
     * Need to think this through.
     * I only really want this on specific fields
     * We could normalize all values but is that bad?
     * Need to consider issues with bubbling actions
     * Maybe... using Ping instead for now?
     */

    const handleEvent = (
      event: CustomEvent<{
        maxLength: number | null;
        ref: string;
        value: string;
        valueRaw: string;
      }>,
    ) => {
      console.log('sync apply! before', event);
      const {
        /** Will be the target title field */
        target,
      } = event;
      if (!target || !(target instanceof HTMLElement)) return;
      const form = target.closest('form');
      if (!form) return;

      console.log('sync apply!', event);

      const {
        maxLength: maxTitleLength,
        ref,
        value: title,
        valueRaw: filename,
      } = event.detail;

      const data = { title };

      const wrapperEvent = form.dispatchEvent(
        new CustomEvent(`wagtail:${ref}-upload`, {
          bubbles: true,
          cancelable: true,
          detail: {
            ...event.detail,
            data,
            filename,
            maxTitleLength,
          },
        }),
      );

      if (!wrapperEvent) {
        // Do not set a title if event.preventDefault(); is called by handler
        // This will disable the controller if the event is prevented?!?!?
        event.preventDefault();
      }

      if (data.title !== title) {
        // If the title has been modified through another listener, update the title field
        //  or we just always do this???
        event.preventDefault();
        target.setAttribute('value', data.title);
      }
    };

    document.addEventListener('w-sync:apply', handleEvent as EventListener);
    // });
  }
}
