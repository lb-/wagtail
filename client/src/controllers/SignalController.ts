import { Controller } from '@hotwired/stimulus';

type SendOptions = {
  /** Whether the event should bubble up the DOM tree. */
  bubbles?: boolean;
  /** Name of the event to be dispatched, if not set the event will be the identifier with ':send' */
  name?: string;
  /** A selector string to find a target or targets to dispatch the event on. */
  target?: string;
};

/**
 * Adds the ability for an blah
 *
 * @example - A button that dispatches an event to another target
 * <button
 *  type="button"
 *  data-controller="w-signal"
 *  data-action="click->w-signal#send"
 *  data-w-signal-name-value="change"
 *  data-w-signal-target-value="#other-button"
 * >
 *  Go
 * </button>
 * <input id="other-button" value="" />
 */
export class SignalController extends Controller<
  HTMLButtonElement | HTMLInputElement | HTMLTextAreaElement
> {
  static values = {
    bubbles: { type: Boolean, default: true },
    name: { type: String, default: '' },
    target: { type: String, default: '' },
  };

  declare bubblesValue: boolean;
  declare nameValue: string;
  declare targetValue: string;

  /**
   * Trigger the dispatching of an event, either to another element via a target
   * selector or dispatches to the controlled element. A custom name can also
   * be provided for this event.
   */
  send(event?: CustomEvent<SendOptions> & { params?: SendOptions }) {
    const {
      bubbles = this.bubblesValue,
      name = this.nameValue || '',
      target: targetSelector = this.targetValue || '',
    } = {
      ...event?.params,
      ...event?.detail,
    };

    const targets = targetSelector
      ? document.querySelectorAll(targetSelector)
      : [this.element];

    Array.from(targets).forEach((target) => {
      this.dispatch(name || 'sent', {
        bubbles,
        cancelable: false,
        target,
        ...(name && { prefix: '' }),
      });
    });
  }
}
