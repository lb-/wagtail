/**
 * this is a bit of a mess
 * creating & removing keyboard shortcuts is not clear
 * mutation observer needs to listen to new children AND changes to attributes
 * probably want a new class
 * addShortcut
 * removeShortcut
 * pause/unpause
 * get label from node
 * node / element / target -> element probably makes more sense
 * Typescript makes it so annoying with HTMLElement stuff!
 */
import Mousetrap from 'mousetrap';

let isPaused;

const getIsHTMLElement = (element): element is HTMLElement =>
  element instanceof HTMLElement;

const getLabelFromNode = (node: HTMLElement): string => {
  const ariaLabel = node.getAttribute('aria-label');
  if (ariaLabel) return node.ariaLabel;

  const [ariaLabelElementId] = (
    node.getAttribute('aria-labelledby') || ''
  ).split(' ');

  const ariaLabelElement = document.getElementById(ariaLabelElementId);

  // first attempt to get label from aria-labelledby
  // then get the innerText
  console.log('getLabelFromElement', {
    element: node,
    ariaLabel: node.ariaLabel,
    val: ariaLabelElement ? ariaLabelElement.innerText : node.innerText,
    innerText: node.innerText,
  });
  return ariaLabelElement ? ariaLabelElement.innerText : node.innerText;
};

const createKeyboardShortcut = (key, { target }) => {
  /** add keyboard shortcut */
  Mousetrap.bind([key], (event) => {
    if (isPaused) return;
    event.preventDefault();
    target?.focus();
    if (target.tagName === 'BUTTON') target?.click();
  });

  return { key, label: getLabelFromNode(target), target };
};

const getKeyboardShortcuts = (elements) =>
  elements
    .filter(getIsHTMLElement)
    .map((target): [string | null, HTMLElement] => {
      const { keyboardShortcut = null } = target.dataset;
      return [keyboardShortcut, target];
    })
    .filter(([keyboardShortcut]) => keyboardShortcut)
    .reduce((acc, [keyboardShortcut, target]) => {
      if (!keyboardShortcut) return acc;

      /** add to collection of loaded keyboard shortcuts */
      const { key, ...shortcutData } = createKeyboardShortcut(
        keyboardShortcut,
        { target },
      );

      return { ...acc, [key]: shortcutData };
    }, {});

/**
 * Set up the keyboard shortcuts based on any element that has `data-keyboard-shortcut`.
 * Allow duplicates to override existing shortcuts (the last element in the DOM will get the shortcut).
 * Ensure that we focus on the element 'triggered' (button or input) and if it is a button
 * trigger the button's click method.
 *
 * Finally, return the resolved shortcuts object.
 */
const initKeyboardShortcuts_OLD = () => {
  isPaused = false;

  let keyboardShortcuts = getKeyboardShortcuts([
    ...document.querySelectorAll('[data-keyboard-shortcut]'),
  ]);

  const observer = new MutationObserver((mutations) => {
    console.log(
      'mutations',

      mutations
        .filter(({ type }) => type === 'childList')
        .reduce<HTMLElement[]>(
          (arr, { addedNodes }) =>
            arr.concat([...addedNodes].filter(getIsHTMLElement)),
          [],
        )
        .reduce<Node[]>(
          (arr, element) =>
            arr.concat([
              ...element.querySelectorAll('[data-keyboard-shortcut]'),
            ]),
          [],
        ),
    );
    // most likely it is not noticing NEW DOM elements with the attribute.

    keyboardShortcuts = {
      ...keyboardShortcuts,
      ...getKeyboardShortcuts(
        mutations
          .filter(({ type }) => type === 'childList')
          .reduce<HTMLElement[]>(
            (arr, { addedNodes }) =>
              arr.concat([...addedNodes].filter(getIsHTMLElement)),
            [],
          )
          .reduce<Node[]>(
            (arr, element) =>
              arr.concat([
                ...element.querySelectorAll('[data-keyboard-shortcut]'),
              ]),
            [],
          ),
      ),
    };

    mutations
      .filter(({ type }) => type === 'attributes')
      .forEach((record) => {
        const { oldValue, target } = record;
        if (!(target instanceof HTMLElement)) return;
        const { keyboardShortcut = null } = target.dataset;

        // if keyboard shortcut removed but did exist
        if (oldValue && !keyboardShortcut) {
          delete keyboardShortcuts[oldValue];
          return;
        }

        // if keyboard shortcut existed but has changed
        if (oldValue && keyboardShortcut && keyboardShortcut !== oldValue) {
          delete keyboardShortcuts[oldValue];
          return;
        }

        if (!keyboardShortcut) return;

        // keyboardShortcut added

        const { key, ...shortcutData } = createKeyboardShortcut(
          keyboardShortcut,
          { target },
        );

        keyboardShortcuts[key] = shortcutData;
      });
  });

  const bodyWrapper = document.querySelector('body > .wrapper');
  if (bodyWrapper) {
    observer.observe(bodyWrapper, {
      attributeFilter: ['data-keyboard-shortcut'],
      attributeOldValue: true,
      childList: true,
      subtree: true,
    });
  }

  // data-keyboard-shortcut-dialog-toggle
  // const keyboardShortcutDialog = document.getElementById(
  //   'keyboard-shortcuts-dialog',
  // );
  // console.log('keyboardShortcutDialog', keyboardShortcutDialog);

  // keyboardShortcutDialog?.addEventListener('show', () => {
  //   console.log('keyboard modal has been shown', keyboardShortcuts);
  // });

  // keyboardShortcutDialog?.addEventListener('hide', () => {
  //   console.log('keyboard modal has been hidden', keyboardShortcuts);
  // });
  // ideally we can do something like

  document.addEventListener('wagtail:dialog-shown', ({ target }) => {
    isPaused = true;
    // if modal id is keyboard-shortcuts-dialog then add content to
    // or if contains data-keyboard-shortcut-dialog-content

    // modal.
    if (!target || !(target instanceof HTMLElement)) return;

    const keyboardShortcutContent = target.querySelector(
      '[data-keyboard-shortcut-dialog-content]',
    );

    const html = Object.entries(keyboardShortcuts).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    // html NOT WORKING!
    // .map(([key, { label }]) => `<li><kbd>${key}</kbd> - ${label}</li>`)
    // .join('');

    console.log('A modal has been shown', {
      keyboardShortcutContent,
      target,
      keyboardShortcuts,
      html,
    });
    // if (!keyboardShortcutContent) return;

    keyboardShortcutContent.innerHtml = html;
  });

  document.addEventListener('wagtail:dialog-hidden', () => {
    isPaused = false;
  });

  return keyboardShortcuts;
};

class KeyboardShortcutManager {
  isPaused: boolean;
  shortcuts: Record<string, { label: string; target: HTMLElement }>;

  constructor() {
    this.isPaused = false;
    this.shortcuts = {};
    this.setupModalPause();
    this.setupShortcuts();
  }

  /**
   *
   * @param key - keyboard shortcut in the Mousetrap format (single string)
   * @param target - node that the keyboard shortcut relates to
   * @param options
   * @param options.label - label to associate with the keyboard shortcut
   */
  createShortcut(
    key: string,
    target: HTMLElement,
    { label = getLabelFromNode(target) }: { label?: string } = {},
  ): void {
    Mousetrap.bind([key], (event) => {
      if (this.isPaused || !target) return;
      event.preventDefault();
      target.focus();
      if (target.tagName === 'BUTTON') target.click();
    });

    this.shortcuts[key] = { label, target };
  }

  setupShortcuts(
    elements: HTMLElement[] = [
      ...document.querySelectorAll('[data-keyboard-shortcut]'),
    ] as HTMLElement[],
  ) {
    elements.forEach((target) => {
      const { keyboardShortcut = null } = target.dataset;
      if (!keyboardShortcut) return;
      this.createShortcut(keyboardShortcut, target);
    });
  }

  /**
   * when modal opens - pause keyboard shortcuts
   */
  setupModalPause() {
    document.addEventListener('wagtail:dialog-shown', () => {
      isPaused = true;
    });

    document.addEventListener('wagtail:dialog-hidden', () => {
      isPaused = false;
    });
  }
}

const initKeyboardShortcuts = () => new KeyboardShortcutManager();

export default initKeyboardShortcuts;
