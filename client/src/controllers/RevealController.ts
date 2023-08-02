import { Controller } from '@hotwired/stimulus';
import type { Application } from '@hotwired/stimulus';

import { domReady } from '../utils/domReady';

/**
 * Adds the ability ...
 *
 * @abstract
 * - open - action of open
 * - opened - state of being opened
 * - close - action to close
 * - closed - state of being closed
 * - toggle - switch from open to closed or visa versa
 * -
 *
 * @example - Minimum attributes
 * <section data-controller="w-reveal">
 *  <button type="button" data-action="w-reveal#toggle" data-w-reveal-target="toggle" aria-controls="my-content" type="button">Toggle</button>
 *  <div id="my-content">CONTENT</div>
 * </section>
 *
 */
export class RevealController extends Controller<HTMLElement> {
  static classes = ['closed', 'openedContent'];

  static targets = ['actions', 'content', 'description', 'toggle'];

  static values = {
    closed: { default: false, type: Boolean },
    findError: {
      default: '[aria-invalid="true"], .error, .w-field--error',
      type: String,
    },
    keepVisible: { default: false, type: Boolean },
    required: { default: false, type: Boolean },
  };

  declare closedValue: boolean;
  declare findErrorValue: string;
  declare keepVisibleValue: boolean;

  declare readonly closedClass: string;
  declare readonly closedClasses: string[];
  declare readonly contentTargets: HTMLElement[];
  declare readonly hasClosedClass: boolean;
  declare readonly hasContentElement: boolean;
  declare readonly hasOpenedContentClass: boolean;
  declare readonly openedContentClasses: string[];
  declare readonly toggleTarget: HTMLElement;

  /**
   * Add full backwards compatibility support for [data-panel] to be updated to a
   * w-panel controlled element if this controller is registered with the `w-panel` identifier.
   *
   * @deprecated RemovedInWagtail60
   */
  static afterLoad(identifier: string, application: Application) {
    const { actionAttribute, controllerAttribute } = application.schema;
    if (identifier !== 'w-panel') return;
    domReady().then(() => {
      document
        .querySelectorAll<HTMLButtonElement>('[data-panel-toggle]')
        .forEach((toggle) => {
          const panel = toggle.closest('[data-panel]');

          const content = document.querySelector<HTMLDivElement>(
            `#${toggle.getAttribute('aria-controls')}`,
          );

          if (!content || !panel) return;

          // set up toggle

          toggle.removeAttribute('data-panel-toggle');

          // alow any existing action attributes to be used if present
          // intentionally adding show/hide event listeners on the toggle (not panel) as this is the common use case
          toggle.setAttribute(
            actionAttribute,
            [
              panel.getAttribute(actionAttribute),
              `click->${identifier}#toggle`,
              `${identifier}:open->${identifier}#open`,
              `${identifier}:close->${identifier}#close`,
            ]
              .filter(Boolean)
              .join(' '),
          );

          toggle.setAttribute(`data-${identifier}-target`, 'toggle');

          // set up all other inside content

          content.setAttribute(`data-${identifier}-target`, 'content');

          content.setAttribute(
            actionAttribute,
            `beforematch->${identifier}#show`,
          );

          panel.querySelectorAll('[data-panel-heading]').forEach((heading) => {
            heading.removeAttribute('data-panel-heading');
          });

          panel
            .querySelectorAll('[data-panel-heading-text]')
            .forEach((heading) => {
              heading.removeAttribute('data-panel-heading-text');
              heading.setAttribute(`data-${identifier}-target`, 'description');
            });

          panel.querySelectorAll('[data-panel-required]').forEach((label) => {
            label.removeAttribute('data-panel-required');
            panel.setAttribute(`data-${identifier}-required-value`, 'true');
          });

          // set up panel (last, as controller will connect here)

          panel.removeAttribute('data-panel');

          panel.setAttribute(
            `data-${identifier}-closed-class-value`,
            'collapsed',
          );

          // Handle existing root element controller attributes if present
          panel.setAttribute(
            controllerAttribute,
            [panel.getAttribute(controllerAttribute), identifier]
              .filter(Boolean)
              .join(' '),
          );
        });
    });
  }

  connect() {
    const toggleTarget = this.toggleTarget;
    // if there is no content element set, try to set one via aria-controls on the toggle
    if (!this.hasContentElement) {
      const content = document.querySelector<HTMLDivElement>(
        `#${toggleTarget.getAttribute('aria-controls')}`,
      );

      if (!content) {
        const error = `data-${this.identifier}-target="content" must be set or aria-controls must target a valid element.`;
        throw new Error(error);
      }

      content.setAttribute(`data-${this.identifier}-target`, 'content');
    }

    const hasError = !!this.element.querySelector(this.findErrorValue);
    const isClosedViaAria =
      toggleTarget.getAttribute('aria-expanded') !== 'true';
    const isClosedViaClass = this.hasClosedClass
      ? this.element.classList.contains(this.closedClass)
      : false;

    // Set initial closed state via initial HTML class or aria-expanded if not in error state
    if (!hasError && (isClosedViaClass || isClosedViaAria)) {
      this.closedValue = true;
    }

    // set initial state via aria-expanded if suitable

    if (document.readyState !== 'complete') {
      document.onreadystatechange = () => {
        if (
          document.readyState === 'complete' &&
          document.querySelector<HTMLElement>('*:target') === this.element
        ) {
          this.scroll();
        }
      };
    }

    this.dispatch('ready', {
      cancelable: false,
      detail: { opened: !this.closedValue },
    });
  }

  closedValueChanged(shouldClose: boolean, previouslyClosed: boolean) {
    if (shouldClose === previouslyClosed) return;
    const contentTargets = this.contentTargets;
    const keepVisible = this.keepVisibleValue;
    const closedClasses = this.closedClasses;
    const openedContentClasses = this.openedContentClasses;
    const toggle = this.toggleTarget;

    if (shouldClose) {
      const event = this.dispatch('closing', { cancelable: true });
      if (event.defaultPrevented) return;
      toggle.setAttribute('aria-expanded', 'false');
      contentTargets.forEach((content) => {
        content.classList.remove(...openedContentClasses);
        if (keepVisible) return;
        /**
         * Use experimental `until-found` value, so users can search inside the panels.
         * Browsers without support for `until-found` will not have this value set
         */
        if ('onbeforematch' in document.body) {
          content.setAttribute('hidden', 'until-found');
        } else {
          // eslint-disable-next-line no-param-reassign
          content.hidden = true;
        }
      });
      this.element.classList.add(...closedClasses);
      this.dispatch('closed', { cancelable: false });
    } else {
      const event = this.dispatch('opening', { cancelable: true });
      if (event.defaultPrevented) return;
      toggle.setAttribute('aria-expanded', 'true');
      contentTargets.forEach((content) => {
        content.classList.add(...openedContentClasses);
        if (keepVisible) return;
        content.hidden = false; // eslint-disable-line no-param-reassign
      });
      this.element.classList.remove(...closedClasses);
      this.dispatch('opened', { cancelable: false });
    }

    this.dispatch('toggled', {
      cancelable: false,
      detail: { opened: !shouldClose },
    });
  }

  open() {
    this.closedValue = false;
  }

  close() {
    this.closedValue = true;
  }

  scroll() {
    this.element.scrollIntoView({ behavior: 'smooth' });
  }

  toggle() {
    this.closedValue = !this.closedValue;
  }
}
