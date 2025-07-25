import { Application } from '@hotwired/stimulus';
import Mousetrap from 'mousetrap';

import { KeyboardController } from './KeyboardController';

jest.mock('../config/wagtailConfig', () => ({
  WAGTAIL_CONFIG: {
    KEYBOARD_SHORTCUTS_ENABLED: true,
  },
}));

describe('KeyboardController', () => {
  let app;
  const buttonClickMock = jest.fn();

  /**
   * Simulates a keydown, keypress, and keyup event for the provided key.
   */
  const simulateKey = (
    { key, which = key.charCodeAt(0), ctrlKey = false, metaKey = false },
    target = document.body,
  ) =>
    Object.fromEntries(
      ['keydown', 'keypress', 'keyup'].map((type) => [
        type,
        target.dispatchEvent(
          new KeyboardEvent(type, {
            bubbles: true,
            cancelable: true,
            key: key,
            which,
            ctrlKey,
            metaKey,
          }),
        ),
      ]),
    );

  const setup = async (html) => {
    document.body.innerHTML = `<main>${html}</main>`;

    app = Application.start();
    app.register('w-kbd', KeyboardController);

    await Promise.resolve();
  };

  beforeAll(() => {
    HTMLButtonElement.prototype.click = buttonClickMock;
  });

  afterEach(() => {
    app?.stop();
    jest.clearAllMocks();
    Mousetrap.reset();
  });

  describe('should load keyboard controller based on the keyboard shortcut preference', () => {
    const mockWagtailConfig = require('../config/wagtailConfig');

    afterEach(() => {
      mockWagtailConfig.WAGTAIL_CONFIG = {
        KEYBOARD_SHORTCUTS_ENABLED: true,
      };
    });

    it('should return true when KEYBOARD_SHORTCUTS_ENABLED is true', () => {
      mockWagtailConfig.WAGTAIL_CONFIG = {
        KEYBOARD_SHORTCUTS_ENABLED: true,
      };

      expect(KeyboardController.shouldLoad).toBe(true);
    });

    it('should return false when KEYBOARD_SHORTCUTS_ENABLED is false', () => {
      mockWagtailConfig.WAGTAIL_CONFIG = {
        KEYBOARD_SHORTCUTS_ENABLED: false,
      };

      expect(KeyboardController.shouldLoad).toBe(false);
    });
  });

  describe('basic keyboard shortcut usage', () => {
    it('should call the click event when the `j` key is pressed after being registered', async () => {
      expect(buttonClickMock).not.toHaveBeenCalled();

      await setup(
        `<button id="btn" data-controller="w-kbd" data-w-kbd-key-value="j">Go</button>`,
      );

      // Simulate the keydown event & check that the default was prevented
      expect(simulateKey({ key: 'j' })).toHaveProperty('keypress', false);

      expect(buttonClickMock).toHaveBeenCalledTimes(1);
      expect(buttonClickMock.mock.contexts).toEqual([
        document.getElementById('btn'),
      ]);
    });

    it('should call the click event when `ctrl+j` is pressed after being registered', async () => {
      expect(buttonClickMock).not.toHaveBeenCalled();

      await setup(
        `<button id="btn" data-controller="w-kbd" data-w-kbd-key-value="ctrl+j">Go</button>`,
      );

      simulateKey({ key: 'j', which: 74, ctrlKey: true });

      expect(buttonClickMock).toHaveBeenCalledTimes(1);
      expect(buttonClickMock.mock.contexts).toEqual([
        document.getElementById('btn'),
      ]);
    });

    it('should call the click event when `command+j` is pressed after being registered', async () => {
      expect(buttonClickMock).not.toHaveBeenCalled();

      await setup(
        `<button id="btn" data-controller="w-kbd" data-w-kbd-key-value="command+j">Go</button>`,
      );

      simulateKey({ key: 'j', which: 74, metaKey: true });

      expect(buttonClickMock).toHaveBeenCalledTimes(1);
      expect(buttonClickMock.mock.contexts).toEqual([
        document.getElementById('btn'),
      ]);
    });

    it('should call the click event when `mod+j` is pressed after being registered', async () => {
      expect(buttonClickMock).not.toHaveBeenCalled();

      await setup(
        `<button id="btn" data-controller="w-kbd" data-w-kbd-key-value="mod+j">Go</button>`,
      );

      simulateKey({ key: 'j', which: 74, metaKey: true });
      simulateKey({ key: 'j', which: 74, ctrlKey: true });

      expect(buttonClickMock).toHaveBeenCalledTimes(1);
      expect([buttonClickMock.mock.contexts[0]]).toEqual([
        document.getElementById('btn'),
      ]);
    });
  });

  describe('aria-keyshortcuts usage', () => {
    it('should take the aria-keyshortcuts attribute if the data-w-kbd-key-value is not set', async () => {
      expect(buttonClickMock).not.toHaveBeenCalled();

      await setup(
        `<button id="btn" data-controller="w-kbd" aria-keyshortcuts="l">Go</button>`,
      );

      simulateKey({ key: 'l' });

      expect(buttonClickMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('keyboard shortcut with scope value', () => {
    it('should fail when the scope value is not global', async () => {
      expect(buttonClickMock).not.toHaveBeenCalled();

      await setup(`
      <button id="btn" data-controller="w-kbd" data-w-kbd-key-value="j">Go</button>
      <input type="text" id="input">
      `);

      // Simulate keydown while target is text input
      simulateKey({ key: 'j' }, document.getElementById('input'));

      expect(buttonClickMock).not.toHaveBeenCalled();
    });

    it('should set the scope value to global when specified', async () => {
      expect(buttonClickMock).not.toHaveBeenCalled();

      await setup(`
      <button id="btn" data-controller="w-kbd" data-w-kbd-key-value="j" data-w-kbd-scope-value="global">Go</button>
      <input type="text" id="input">
      `);

      // Simulate keydown while target is text input
      simulateKey({ key: 'j' }, document.getElementById('input'));

      expect(buttonClickMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('using an element target instead of controlled element', () => {
    it('should call the click event when the `j` key is pressed after being registered', async () => {
      expect(buttonClickMock).not.toHaveBeenCalled();

      await setup(
        `
        <aside data-controller="w-kbd" data-w-kbd-key-value="j">
          <button id="btn" data-w-kbd-target="element" type="button">Go</button>
        </aside>
        `,
      );

      expect(simulateKey({ key: 'j' }, document.getElementById('btn')));

      expect(buttonClickMock).toHaveBeenCalledTimes(1);
      expect(buttonClickMock.mock.contexts).toEqual([
        document.getElementById('btn'),
      ]);
    });

    it('should take the aria-keyshortcuts attribute if the data-w-kbd-key-value is not set', async () => {
      expect(buttonClickMock).not.toHaveBeenCalled();

      await setup(
        `
        <aside data-controller="w-kbd">
          <button id="btn" aria-keyshortcuts="j" data-w-kbd-target="element" type="button">Go</button>
        </aside>
        `,
      );

      simulateKey({ key: 'j' });

      expect(buttonClickMock).toHaveBeenCalledTimes(1);
    });
  });
});
