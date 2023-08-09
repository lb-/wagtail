import { Controller } from '@hotwired/stimulus';
import type { Application } from '@hotwired/stimulus';

import { domReady } from '../utils/domReady';
import { noop } from '../utils/noop';

/**
 * Adds the ability ...
 *
 * @abstract - definitions
 * - open - action of open
 * - opened - state of being opened
 * - close - action to close
 * - closed - state of being closed
 * - toggle - switch from open to closed or visa versa
 *
 * @example - Minimum attributes
 * <section data-controller="w-panel">
 *  <button type="button" data-action="w-panel#toggle" data-w-panel-target="toggle" aria-controls="my-content" type="button">Toggle</button>
 *  <div id="my-content">CONTENT</div>
 * </section>
 */
export class PanelController extends Controller<HTMLElement> {
  static classes = ['closed', 'openedContent'];

  static targets = [
    'anchor',
    'content',
    'controls',
    'heading',
    'label',
    'toggle',
  ];

  static values = {
    closed: { default: false, type: Boolean },
    required: { default: false, type: Boolean },
    useHidden: { default: false, type: Boolean },
  };

  declare closedValue: boolean;
  declare requiredValue: boolean;
  declare useHiddenValue: boolean;

  declare readonly anchorTarget: HTMLAnchorElement;
  declare readonly closedClass: string;
  declare readonly closedClasses: string[];
  declare readonly contentTarget: HTMLElement;
  declare readonly contentTargets: HTMLElement[];
  declare readonly controlsTarget: HTMLElement;
  declare readonly hasAnchorTarget: boolean;
  declare readonly hasClosedClass: boolean;
  declare readonly hasContentTarget: boolean;
  declare readonly hasHeadingTarget: boolean;
  declare readonly hasLabelTarget: boolean;
  declare readonly hasOpenedContentClass: boolean;
  declare readonly hasToggleTarget: boolean;
  declare readonly headingTarget: HTMLHeadingElement;
  declare readonly labelTarget: HTMLElement;
  declare readonly openedContentClasses: string[];
  declare readonly toggleTarget: HTMLButtonElement;

  /**
   * Ensure that targets are correctly set up, as this runs
   * before the initial call to `closedValueChanged`.
   * If there is no content element set, try to set one
   * via `aria-controls` on the toggle, this also ensures
   * that the toggleTarget has been set before the controller
   * connects.
   *
   * Additionally, set the initial closed value if the class or aria-expanded
   * is set so that the initial state is correct.
   */
  initialize(): void {
    const toggleTarget = this.toggleTarget;

    if (!this.hasContentTarget) {
      const ariaControlsSelectors = (
        toggleTarget.getAttribute('aria-controls') || ''
      )
        .split(' ')
        .filter(Boolean)
        .map((id) => `#${id}`)
        .join(',');

      const contentElements = ariaControlsSelectors
        ? document.querySelectorAll(ariaControlsSelectors)
        : [];

      if (!contentElements.length) {
        const error = `data-${this.identifier}-target="content" must be set or aria-controls must target a valid element.`;
        throw new Error(error);
      }

      contentElements.forEach((content) => {
        content.setAttribute(`data-${this.identifier}-target`, 'content');
      });
    }

    if (!this.hasHeadingTarget) {
      const [headingId] = (
        this.element.getAttribute('aria-labelledby') || ''
      ).split(' ');
      const heading = headingId && document.getElementById(headingId);
      if (heading) {
        heading.setAttribute(`data-${this.identifier}-target`, 'heading');
      } else {
        const error = `data-${this.identifier}-target="heading" must be set or aria-labelledby must target a valid element.`;
        throw new Error(error);
      }
    }

    const isAriaClosed = toggleTarget.getAttribute('aria-expanded') !== 'true';
    const isClassNameClosed = this.hasClosedClass
      ? this.element.classList.contains(this.closedClass)
      : false;

    if (isAriaClosed || isClassNameClosed) this.closedValue = true;
  }

  connect() {
    this.dispatch('ready', {
      cancelable: false,
      detail: {
        label: this.label,
        level: this.level,
        opened: !this.closedValue,
      },
    });
  }

  closedValueChanged(shouldClose: boolean, previouslyClosed?: boolean) {
    if (previouslyClosed === shouldClose) return;

    const closedClasses = this.closedClasses;
    const contentTargets = this.contentTargets;
    const isInitial = previouslyClosed === undefined;
    const openedContentClasses = this.openedContentClasses;
    const useHiddenValue = this.useHiddenValue;
    // Work around uncaught error if the controller is not set up correctly,
    // if the target is not set, we will still see an error from the initialize method.
    // See https://github.com/hotwired/stimulus/issues/711
    const toggle = this.hasToggleTarget
      ? this.toggleTarget
      : { setAttribute: noop };

    if (shouldClose) {
      const event = this.dispatch('closing', { cancelable: true });
      if (event.defaultPrevented) return;
      toggle.setAttribute('aria-expanded', 'false');
      contentTargets.forEach((content) => {
        content.classList.remove(...openedContentClasses);
        if (!useHiddenValue) return;
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
        if (!useHiddenValue) return;
        content.hidden = false; // eslint-disable-line no-param-reassign
      });
      this.element.classList.remove(...closedClasses);
      this.dispatch('opened', { cancelable: false });
    }

    // Dispatch on the toggle, not the controller only if not the initial change.
    if (isInitial) return;
    this.dispatch('changed', {
      cancelable: false,
      detail: { label: this.label, level: this.level, opened: !shouldClose },
      target: toggle instanceof Element ? toggle : this.element,
    });
  }

  close() {
    this.closedValue = true;
  }

  open() {
    this.closedValue = false;
  }

  scroll() {
    this.element.scrollIntoView({ behavior: 'smooth' });
  }

  toggle() {
    this.closedValue = !this.closedValue;
  }

  get icon(): string {
    const useElt = this.toggleTarget.querySelector<SVGUseElement>('use');
    return useElt?.getAttribute('href')?.replace('#icon-', '') || '';
  }

  /**
   * Lazily resolve each check function until one returns a truthy value
   * to use as a label for this panel. This avoids thrashing the DOM
   * and allows for us to get the latest label as DOM content changes (e.g. StreamField).
   */
  get label(): string {
    return [
      () => this.hasLabelTarget && this.labelTarget,
      () => this.hasHeadingTarget && this.headingTarget,
      /**
       * Attempt to find a aria-describedby referenced element
       * and pull content from there.
       */
      () => {
        if (!this.hasToggleTarget) return null;
        const describedby = this.toggleTarget.getAttribute('aria-describedby');
        if (!describedby) return null;
        const [id] = describedby.split(' ').filter(Boolean);
        return id && document.getElementById(id);
      },
      /** Fall back as a last resort on any label used within the content. */
      () => this.contentTarget?.querySelector('label'),
    ].reduce((acc, fn) => {
      if (acc) return acc; // Short circuit if we already have a label.
      const result = fn();
      const value = result instanceof Element ? result.textContent : result;
      return (value || '').replace(/\s+\*\s+$/g, '').trim();
    }, '');
  }

  get level(): number {
    const defaultLevel = 2;
    if (!this.hasHeadingTarget) return defaultLevel;
    const heading = this.headingTarget;
    const ariaLevel = heading.getAttribute('aria-level');
    return Number(ariaLevel || heading.tagName[1] || defaultLevel);
  }

  /**
   * Add full backwards compatibility support for [data-panel] to be updated to a
   * w-panel controlled element if this controller is registered with the `w-panel` identifier.
   *
   * This includes a mutation observer for any data-panel usage that may be left over in
   * dynamic content such as async modals or StreamField.
   *
   * @deprecated RemovedInWagtail60
   */
  static afterLoad(identifier: string, application: Application) {
    const { actionAttribute, controllerAttribute } = application.schema;
    if (identifier !== 'w-panel') return;

    const convertToggle = (toggle: HTMLElement) => {
      const panel = toggle.closest('[data-panel]');

      // Assume we will only ever have a simple (single) aria-controls reference
      const content = document.querySelector<HTMLDivElement>(
        `#${toggle.getAttribute('aria-controls')}`,
      );

      if (!content || !panel) return;

      // Set up toggle

      toggle.removeAttribute('data-panel-toggle');

      // Alow any existing action attributes to be used if present.
      // Intentionally adding show/hide event listeners on the toggle
      // (not panel) as this is the common use case.
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

      // Set up all other inside content

      content.setAttribute(`data-${identifier}-target`, 'content');

      content.setAttribute(actionAttribute, `beforematch->${identifier}#show`);

      panel.querySelectorAll('[data-panel-anchor]').forEach((element) => {
        element.removeAttribute('data-panel-anchor');
        element.setAttribute(`data-${identifier}-target`, 'anchor');
      });

      panel.querySelectorAll('[data-panel-controls]').forEach((element) => {
        element.removeAttribute('data-panel-controls');
        element.setAttribute(`data-${identifier}-target`, 'controls');
      });

      panel.querySelectorAll('[data-panel-heading]').forEach((element) => {
        element.removeAttribute('data-panel-heading');
        element.setAttribute(`data-${identifier}-target`, 'heading');
        element.setAttribute(actionAttribute, `click->${identifier}#toggle`);
      });

      panel.querySelectorAll('[data-panel-heading-text]').forEach((element) => {
        element.removeAttribute('data-panel-heading-text');
        element.setAttribute(`data-${identifier}-target`, 'label');
      });

      panel.querySelectorAll('[data-panel-required]').forEach((element) => {
        element.removeAttribute('data-panel-required');
        panel.setAttribute(`data-${identifier}-required-value`, 'true');
      });

      // Set up panel (last, as controller will connect here)

      panel.removeAttribute('data-panel');
      panel.setAttribute(`data-${identifier}-closed-class`, 'collapsed');
      panel.setAttribute(`data-${identifier}-use-hidden-value`, 'true');

      /**
       * Handle existing root element action attributes if present.
       * Smooth scroll onto any active panel.
       * Needs to run after the whole page is loaded so the browser can resolve any
       * JS-rendered :target.
       */
      panel.setAttribute(
        actionAttribute,
        [
          panel.getAttribute(actionAttribute),
          `readystatechange@document->${identifier}#scroll:once:target`,
          `w-count:above->${identifier}#open:self:once`,
        ]
          .filter(Boolean)
          .join(' '),
      );

      /**
       * Handle existing root element controller attributes if present
       */
      panel.setAttribute(
        controllerAttribute,
        [panel.getAttribute(controllerAttribute), identifier]
          .filter(Boolean)
          .join(' '),
      );
    };

    domReady().then(() => {
      const attr = 'data-panel-toggle';

      document
        .querySelectorAll<HTMLButtonElement>(`[${attr}]`)
        .forEach(convertToggle);

      const observer = new MutationObserver((mutationList) => {
        mutationList
          .flatMap(({ addedNodes, target }) =>
            [target, [...addedNodes]].filter(
              (node): node is Element => node instanceof Element,
            ),
          )
          .flatMap((element) =>
            element.hasAttribute(attr)
              ? [element]
              : [...element.querySelectorAll(`[${attr}]`)],
          )
          .filter((node): node is HTMLElement => node instanceof HTMLElement)
          .forEach(convertToggle);
      });

      // ensure that we track any newly added legacy panels
      // wait for all Stimulus controllers to be loaded
      setTimeout(() => {
        observer.observe(document.body, {
          attributeFilter: [attr],
          attributeOldValue: false,
          attributes: true,
          childList: true,
          subtree: true,
        });
      });
    });
  }
}
