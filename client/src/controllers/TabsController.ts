import { Controller } from '@hotwired/stimulus';
import { debounce } from '../utils/debounce';

/**
 * TODO
 * - GOSH
 * - consistent label/tab/button usage - just pick one
 * - Look at flow of instantiation, it's a bit broken
 */


/**
 * Returns a promise that will resolve after either the animation, translation
 * or the max delay of time is reached.
 *
 * If `maxDelay` is provided as zero or a falsey value, the promise resolve immediately.
 */
const afterTransition = (element: HTMLElement, { maxDelay = 300 } = {}) => {
  /**
   * Allow the passing of an initial value to the resolved promise.
   * If nothings is passed, the event will be passed to the promise.
   */
  let initValue: any;
  const promise = new Promise<AnimationEvent | TransitionEvent | undefined>(
    (resolve) => {
      if (!maxDelay) {
        resolve(initValue);
        return;
      }
      let timer: number | undefined;
      const finish = (event: AnimationEvent | TransitionEvent | undefined) => {
        if (event && event.target !== element) return;
        window.clearTimeout(timer);
        element.removeEventListener('transitionend', finish);
        element.removeEventListener('animationend', finish);
        resolve(initValue || event);
      };
      element.addEventListener('animationend', finish);
      element.addEventListener('transitionend', finish);
      timer = window.setTimeout(finish, maxDelay);
    },
  );
  return (init: any) => {
    initValue = typeof init === 'function' ? init() : init;
    return promise;
  };
};

interface IndexedEventTarget extends EventTarget {
  index: number; // really want to get rid of this!!
}

interface TabLink extends HTMLAnchorElement {
  index: number; // really want to get rid of this!!
}

/**
 * Adds the ability for the controlled elements to behave as selectable tabs.
 *
 * @description
 * - All tabs and tab content must be nested in an element within the scope of the controller.
 * - All tab buttons need the `role="tab"` attribute and a `href` with the tab content `id` with the target `tab`.
 * - Tab contents need to have the `role="tabpanel"` attribute and and `id` attribute that matches the `href` of the tab link with the target 'panel'.
 * - Tab buttons should also be wrapped in an element with the `role="tablist"` attribute.
 * - Use the target 'trigger' on an Anchor link and set the `href` to the `id` of the tab you would like to trigger.
 *
 * @example
 * ```html
 * <div data-controller="w-tabs" data-action="popstate@window->w-tabs#loadHistory" data-w-tabs-selected-class="animate-in">
 *   <div role="tablist" data-action="keydown.right->w-tabs#selectNext keydown.left->w-tabs#selectPrevious keydown.home->w-tabs#selectFirst keydown.end->w-tabs#selectLast">
 *     <a id="tab-1" href="#tab-panel-1" role="tab" data-w-tabs-target="tab" data-action="w-tabs#select:prevent">Tab 1</a>
 *     <a id="tab-2" href="#tab-panel-2" role="tab" data-w-tabs-target="tab" data-action="w-tabs#select:prevent">Tab 2</a>
 *   </div>
 *   <div class="tab-content">
 *     <section id="tab-tab-1" role="tabpanel" aria-labelledby="tab-1" data-w-tabs-target="panel">
 *       Tab 1 content
 *     </section>
 *     <section id="tab-tab-2" role="tabpanel" aria-labelledby="tab-2" data-w-tabs-target="panel">
 *       Tab 2 content
 *     </section>
 *   </div>
 * </div>
 * ```
 */
export class TabsController extends Controller<HTMLElement> {
  static classes = ['selected'];

  /**
   * @todo - it would be nice to not need the trigger... could we throw an error on select? might be good enough.
   */
  static targets = ['panel', 'tab', 'trigger'];

  static values = {
    // animate: { default: false, type: Boolean },
    selected: { default: '', type: String },
    syncLocation: { default: false, type: Boolean },
    transition: { default: 150, type: Number }, // should change to transitionDuration
  };

  // /** If true, animation will run when a new tab is selected. */
  // declare animateValue: boolean;
  /** ID of the currently selected tab. */
  declare selectedValue: string;

  /** Tab content panels, with role='tabpanel', showing the content for each tab. */
  declare readonly panelTargets: HTMLElement[];
  /** Classes to set on the tab panel content when selected. */
  declare readonly selectedClasses: string[];
  /** Tab elements, with role='tab', allowing selection of tabs. */
  declare readonly tabTargets: HTMLAnchorElement[];
  /** If true, the selected tab will sync with the URL hash. */
  declare readonly syncLocationValue: boolean;
  /** The time in milliseconds for the tab content to transition in and out. */
  declare readonly transitionValue: number;
  /** Other elements within the controller's scope that may trigger a specific tab. */
  declare readonly triggerTargets: HTMLAnchorElement[];

  connect() {
    this.validate();

    debounce(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, this.transitionValue * 2)();

    this.setAriaControls(this.tabTargets);
    this.setTabLabelIndex();

    const activeTab = this.tabTargets.find(
      (target) =>
        target.getAttribute('aria-selected') === 'true' ||
        target.getAttribute('aria-controls') === this.selectedValue,
    );

    // console.log({ activeTab, id: activeTab?.id });

    if (this.selectedClasses.length && activeTab) {
      activeTab.setAttribute('aria-selected', 'true');
      activeTab.removeAttribute('tabindex');
    }

    this.panelTargets.forEach((tab) => {
      // eslint-disable-next-line no-param-reassign
      tab.hidden = true;
    });

    if (window.location.hash && this.syncLocationValue) {
      this.setTabByURLHash();
    } else if (activeTab) {
      // console.log('active tab exists');
      this.selectedValue = activeTab.getAttribute('aria-controls') as string;
    } else {
      this.selectFirst();
    }

    this.setAriaControls(this.triggerTargets);
  }

  selectedValueChanged(currentValue: string, previousValue: string) {
    if (previousValue) {
      this.hideTabContent(previousValue);
    }

    const tab = this.getTabLabelByHref(currentValue);
    // console.log('selectedValueChanged', { tab, currentValue });

    if (tab) {
      tab.setAttribute('aria-selected', 'true');
      tab.removeAttribute('tabindex');
    }

    const tabContent = this.getTabPanelByHref(currentValue);

    if (tabContent) {
      if (this.animateValue) {
        this.animateIn(tabContent);
      } else {
        tabContent.hidden = false;
      }

      this.dispatch('selected', {
        cancelable: false,
        detail: { selected: currentValue },
        target: tab,
      });

      if (!this.syncLocationValue) {
        this.setURLHash(currentValue);
      }
    }
  }

  getTabLabelByHref(tabId: string): HTMLElement | undefined {
    return this.tabTargets.find(
      (tab) => tab.getAttribute('aria-controls') === tabId,
    );
  }

  getTabPanelByHref(tabId: string): HTMLElement | undefined {
    return this.panelTargets.find((tab) => tab.getAttribute('id') === tabId);
  }

  setAriaControls(tabLinks: HTMLAnchorElement[]) {
    tabLinks.forEach((tabLink) => {
      const href = tabLink.getAttribute('href') as string;
      tabLink.setAttribute('aria-controls', href.replace('#', ''));
    });
  }

  setTabLabelIndex() {
    (this.tabTargets as TabLink[]).forEach((label, index) => {
      // eslint-disable-next-line no-param-reassign
      label.index = index;
    });
  }

  setURLHash(tabId: string) {
    if (!window.history.state || window.history.state.tabContent !== tabId) {
      // Add a new history item to the stack
      window.history.pushState({ tabContent: tabId }, '', `#${tabId}`);
    }
  }

  setTabByURLHash() {
    if (window.location.hash) {
      const cleanedHash = window.location.hash
        .replace(/[^\w\-#]/g, '')
        .replace('#', '');

      const isCleanHashPresent = this.tabTargets.find(
        (value) => value.id === cleanedHash,
      );

      if (cleanedHash && isCleanHashPresent) {
        this.selectedValue = cleanedHash;
      } else {
        // The hash doesn't match a tab on the page then select first tab
        this.selectFirst();
      }
    }
  }

  // Should have a selectTab and unselectTab method that handles the transition and hiding
  // or a showPanel hidePanel would be better - because it's about the panel not the selection!!


  animateIn(tabContent: HTMLElement) {
    const selectedClasses = this.selectedClasses;
    console.log('animate in called?', {selectedClasses, maxDelay: this.transitionValue})
    afterTransition(
      tabContent,
      // If there are no classes to add, we can skip the delay before hiding.
      selectedClasses.length
        ? { maxDelay: this.transitionValue }
        : { maxDelay: 0 },
    )(tabContent.classList.add(...selectedClasses)).then(() => {
      // eslint-disable-next-line no-param-reassign
      tabContent.hidden = false;
    });
  }

  animateOut(tabContent: HTMLElement) {
    const selectedClasses = this.selectedClasses;
    afterTransition(
      tabContent,
      // If there are no classes to add, we can skip the delay before hiding.
      selectedClasses.length
        ? { maxDelay: this.transitionValue }
        : { maxDelay: 0 },
    )(tabContent.classList.remove(...selectedClasses)).then(() => {
      // eslint-disable-next-line no-param-reassign
      tabContent.hidden = true;
    });
  }

  hideTabContent(tabId: string) {
    if (tabId === this.selectedValue || !this.selectedValue) {
      return;
    }

    const tabContent = this.getTabPanelByHref(tabId);

    if (!tabContent) return;

    if (this.animateValue) {
      this.animateOut(tabContent);
    } else {
      tabContent.hidden = true;
    }

    const tab = this.getTabLabelByHref(tabId);

    if (!tab) return;

    tab.setAttribute('aria-selected', 'false');
    tab.setAttribute('tabindex', '-1');
  }

  select(event: MouseEvent) {
    const tabId = (event.target as HTMLElement).getAttribute(
      'aria-controls',
    ) as string;
    this.selectedValue = tabId;
  }

  selectPrevious(event: Event) {
    const tabIndex = (event.target as IndexedEventTarget).index;
    const tab = this.tabTargets[tabIndex + -1];

    if (!tab) return;

    this.selectedValue = tab.getAttribute('aria-controls') as string;
    tab.focus();
  }

  selectNext(event: Event) {
    const tabIndex = (event.target as IndexedEventTarget).index;
    const tab = this.tabTargets[tabIndex + 1];

    if (!tab) return;

    this.selectedValue = tab.getAttribute('aria-controls') as string;
    tab.focus();
  }

  selectFirst(event?: Event) {
    const tab = this.tabTargets[0];
    this.selectedValue = tab.getAttribute('aria-controls') as string;
    if (event) tab.focus();
  }

  selectLast(event?: Event) {
    const tab = this.tabTargets[this.tabTargets.length - 1];
    this.selectedValue = tab.getAttribute('aria-controls') as string;
    if (event) tab.focus();
  }

  loadHistory(event: PopStateEvent) {
    if (event.state && event.state.tabContent) {
      const tab = this.getTabLabelByHref(event.state.tabContent);
      if (tab) {
        this.selectedValue = event.state.tabContent;
        tab.focus();
      }
    }
  }

  validate() {
    const labels = this.tabTargets;
    const panels = this.panelTargets;

    labels.forEach((label, index) => {
      const panel = panels[index];

      if (label.getAttribute('role') !== 'tab') {
        // eslint-disable-next-line no-console
        console.warn(
          label,
          "Tab nav elements must have the `role='tab'` attribute set",
        );
      }

      if (panel.getAttribute('role') !== 'tabpanel') {
        // eslint-disable-next-line no-console
        console.warn(
          panel,
          "Tab panel elements must have the `role='tabpanel'` attribute set.",
        );
      }

      if (panel.getAttribute('aria-labelledby') !== label.id) {
        // eslint-disable-next-line no-console
        console.warn(
          panel,
          'Tab panel element must have `aria-labelledby` set to the id of the tab nav element.',
        );
      }
    });

    if (
      labels.every(
        (target) =>
          (target.parentElement as HTMLElement).getAttribute('role') !==
          'tablist',
      )
    ) {
      // eslint-disable-next-line no-console
      console.warn(
        labels,
        "One or more tab (label) targets are not direct descendants of an element with `role='tablist'`.",
      );
    }
  }
}
