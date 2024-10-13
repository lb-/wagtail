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
    quiet: { default: false, type: Boolean },
    ref: String,
    target: String,
  };

  declare debounceValue: number;
  declare delayValue: number;
  declare disabledValue: boolean;
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
    this.processTargetElements('start', true);
    this.apply = debounce(this.apply.bind(this), this.debounceValue);
  }

  /**
   * Allows for targeted elements to determine, via preventing the default event,
   * whether this sync controller should be disabled.
   */
  check() {
    this.processTargetElements('check', true);
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
    this.processTargetElements('ping', false, { bubbles: true });
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
    if (!resetDisabledValue && this.disabledValue) {
      return [];
    }

    const targetElements = [
      ...document.querySelectorAll<HTMLElement>(this.targetValue),
    ];

    const elements = targetElements.filter((target) => {
      const element = this.element;
      const value = element.value;
      const ref = this.refValue;

      const normalized =
        element.type === 'file'
          ? value
              .split('\\')
              .slice(-1)[0]
              .replace(/\.[^.]+$/, '')
          : value;

      const maxLength = Number(target.getAttribute('maxlength')) || null;
      const required = !!target.hasAttribute('required');

      /** need a way to support legacy event approach */

      const event = this.dispatch(eventName, {
        bubbles: true, // argh - this should be true but not sure if it will break other things
        cancelable: true,
        ...options, // allow overriding some options but not detail & target
        detail: { element, maxLength, normalized, ref, required, value },
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
        normalized: string;
        value: string;
        maxLength: number | null;
        ref: string;
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
        normalized: title,
        ref,
        value: filename,
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
