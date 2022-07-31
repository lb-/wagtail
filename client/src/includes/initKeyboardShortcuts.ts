import $ from 'jquery';

import Mousetrap from 'mousetrap';

/**
 * Import using require as plugins have side-effects only.
 * Non-Typescript module wrapper around Mousetrap so that plugins can be instantiated.
 * Typescript was not allowing the non-use of variables in scope and using require does
 * not correctly assign the types, hence assigning to unused.
 */
import pause from 'mousetrap/plugins/pause/mousetrap-pause';
import globalBind from 'mousetrap/plugins/global-bind/mousetrap-global-bind';

import { gettext } from '../utils/gettext';

const isHTMLElement = (element): element is HTMLElement =>
  element instanceof HTMLElement;

/**
 * Set up the keyboard shortcuts based on any element that has `data-keyboard-shortcut`.
 * Ensure that any duplicates are handled (the last element in the DOM will get the shortcut).
 * Ensure that we focus on the element 'triggered' (button or input) and if it is a button
 * trigger the button's click method. Handle cases where modals are opened and shortcuts should
 * not be activated.
 */
class KeyboardShortcutManager {
  attr: string;
  shortcuts: Record<string, { target: HTMLElement }>;
  unused: Record<string, any>[];

  constructor() {
    this.attr = 'data-keyboard-shortcut';
    this.unused = [globalBind, pause];
    this.shortcuts = {};
    this.setupListeners();
    this.setupShortcuts();
    this.setupObserver();
  }

  /**
   * Create a shortcut using Mousetrap that automatically focuses and/or
   * triggers the target element. Alternatively allow for a custom callback.
   *
   * @param key - keyboard shortcut in the Mousetrap format (single string)
   * @param target - node that the keyboard shortcut relates to, will be focused/activated if no callback supplied
   * @param callback - optional function to use as the keyboard shortcut callback in place of focusing on a target
   * @param {Object} options - isGlobal - if true, will use the bindGlobal plugin to allow triggering inside fields
   */
  createShortcut(
    key: string | string[],
    target: HTMLElement,
    callback: ((arg0: Event) => void) | null = null,
    { isGlobal = false }: { isGlobal?: boolean } = {},
  ): void {
    this.removeShortcut(key); // first - remove any existing keyboard shortcut mapping
    (isGlobal ? Mousetrap.bindGlobal : Mousetrap.bind)(key, (event: Event) => {
      // if keyboard modal is open - allow keyboard shortcuts but close the modal first.
      if (this.keyboardModal) {
        this.keyboardModal.dispatch(new CustomEvent('wagtail:hide'));
      }
      if (typeof callback === 'function') {
        callback(event);
        return;
      }
      event.preventDefault();
      target.focus();
      if (target.tagName === 'BUTTON') target.click();
    });

    this.shortcuts[Array.isArray(key) ? key.join('__') : key] = { target };
  }

  removeShortcut(key: string | string[]) {
    Mousetrap.unbind(key);
    delete this.shortcuts[Array.isArray(key) ? key.join('__') : key];
  }

  /**
   * Setup shortcuts for elements in the DOM on load with the data attribute.
   */
  setupShortcuts(
    elements: HTMLElement[] = [
      ...document.querySelectorAll(`[${this.attr}]`),
    ] as HTMLElement[],
  ) {
    elements.forEach((target) => {
      const { keyboardShortcut = null } = target.dataset;
      if (!keyboardShortcut) return;
      this.createShortcut(keyboardShortcut, target);
    });
  }

  /**
   * When modal opens - pause keyboard shortcuts.
   * Allow for custom registration of keyboard shortcuts with DOM events.
   */
  setupListeners() {
    // a11y modals
    document.addEventListener('wagtail:dialog-shown', (({
      detail: { shown = false } = {},
      target,
    }: CustomEvent<{ shown?: boolean }>) => {
      if (shown) {
        const keyboardShortcutModalContent = target.querySelector(
          '[data-keyboard-shortcut-dialog-content]',
        );
        if (keyboardShortcutModalContent) {
          this.keyboardModal = target;
          this.updateModalContent(keyboardShortcutModalContent);
          return;
        }
        Mousetrap.pause();
      } else {
        Mousetrap.unpause();
      }
    }) as EventListener);

    // bootstrap modals
    $(document).on('shown.bs.modal', Mousetrap.pause);
    $(document).on('hidden.bs.modal', Mousetrap.unpause);

    // allow keyboard shortcuts to be registered without the HTML data attribute approach
    document.addEventListener('wagtail:bind-keyboard-shortcut', (({
      detail: { callback = null, key, target, ...options } = {},
    }: CustomEvent<
      | {
          callback?: ((arg0: Event) => void) | null;
          isGlobal?: boolean;
          key: string[];
          options: Record<string, never>;
          target: HTMLElement;
        }
      | Record<string, never>
    >) => {
      this.createShortcut(key, target, callback, options);
    }) as EventListener);
  }

  /**
   * Sets up a MutationObserver to listen for any new or changed
   */
  setupObserver() {
    const observer = new MutationObserver((mutations) => {
      this.setupShortcuts(
        mutations
          .filter(({ type }) => type === 'childList')
          .reduce<Node[]>(
            (arr, { addedNodes }) => arr.concat([...addedNodes]),
            [],
          )
          .filter(isHTMLElement)
          .reduce<HTMLElement[]>(
            (arr, element) =>
              arr.concat(
                [...element.querySelectorAll(`[${this.attr}]`)].filter(
                  isHTMLElement,
                ),
              ),
            [],
          ),
      );

      mutations
        .filter(({ type }) => type === 'attributes')
        .forEach((record) => {
          const { oldValue, target } = record;
          if (!isHTMLElement(target)) return;
          const { keyboardShortcut = null } = target.dataset;

          if (oldValue) {
            // if keyboard shortcut removed but did exist
            if (!keyboardShortcut) {
              this.removeShortcut(oldValue);
              return;
            }

            // if keyboard shortcut existed but has changed
            if (keyboardShortcut && keyboardShortcut !== oldValue) {
              this.removeShortcut(oldValue);
            }
          }

          if (!keyboardShortcut) return;

          this.createShortcut(keyboardShortcut, target);
        });
    });

    const bodyWrapper = document.querySelector('body > .wrapper');
    if (bodyWrapper) {
      observer.observe(bodyWrapper, {
        attributeFilter: [this.attr],
        attributeOldValue: true,
        childList: true,
        subtree: true,
      });
    }
  }

  getKeyLabel(key) {
    const capitaliseFirstLetter = (
      [first, ...rest],
      locale = navigator.language,
    ) =>
      first === undefined
        ? ''
        : first.toLocaleUpperCase(locale) + rest.join('');

    // IS_MAC_OS ? '⌘ + Alt + M' : 'Ctrl + Alt + M'
    // ⌥
    if (key === 'alt') return '⌥';
    if (key === 'mod') return '⌘';
    if (key === 'meta') return '??';
    if (key.length <= 1) return key;
    return capitaliseFirstLetter(key);
  }

  updateModalContent(target: HTMLElement) {
    // want to do something where the modal can close
    console.log('keyboardShortcutModalContent', target);

    target.innerHTML = Object.entries(this.shortcuts)
      .map(
        ([key]) =>
          `<li><samp>${key
            .split('__')
            .join(gettext(' or '))
            .split('+')
            .map((innerKey) => `<kbd>${this.getKeyLabel(innerKey)}</kbd>`)
            .join(' + ')}</samp> - <strong>Description!</strong></li>`,
      )
      .join('');
  }
}

const initKeyboardShortcuts = () => new KeyboardShortcutManager();

export default initKeyboardShortcuts;
