import { Application } from '@hotwired/stimulus';
import { TabsController } from './TabsController';

function simulateKeydown(key) {
  const event = new KeyboardEvent('keydown', {
    key,
    code: key,
    bubbles: true,
    cancelable: true,
  });
  document.activeElement.dispatchEvent(event);
}

jest.useFakeTimers();

describe('TabsController', () => {
  let app;
  const oldWindowLocation = window.location;

  const setup = async (
    html = `
    <div class="w-tabs" data-controller="w-tabs" data-action="popstate@window->w-tabs#loadHistory" data-w-tabs-selected-class="animate-in">
      <div role="tablist" data-action="keydown.right->w-tabs#selectNext keydown.left->w-tabs#selectPrevious keydown.home->w-tabs#selectFirst keydown.end->w-tabs#selectLast">
        <a id="tab-1" href="#tab-panel-1" role="tab" tabindex="-1" data-w-tabs-target="tab" data-action="w-tabs#select:prevent">
          Cheese
        </a>
        <a id="tab-2" href="#tab-panel-2" role="tab" data-action="w-tabs#select:prevent" data-w-tabs-target="tab">
          Chocolate
        </a>
        <a id="tab-3" href="#tab-panel-3" role="tab" data-action="w-tabs#select:prevent" data-w-tabs-target="tab">
          Coffee
        </a>
      </div>
      <div class="tab-content">
        <section id="tab-panel-1" role="tabpanel" aria-labelledby="tab-1" data-w-tabs-target="panel">
          All about cheese
        </section>
        <section id="tab-panel-2" role="tabpanel" aria-labelledby="tab-2" data-w-tabs-target="panel">
          All about chocolate
        </section>
        <section id="tab-panel-3" role="tabpanel" aria-labelledby="tab-3" data-w-tabs-target="panel">
          All about coffee
        </section>
      </div>
    </div>
  `,
    identifier = 'w-tabs',
  ) => {
    document.body.innerHTML = `<main>${html}</main>`;
    app = Application.start();
    app.register(identifier, TabsController);
    await Promise.resolve();
  };

  beforeAll(() => {
    delete window.location;

    window.location = Object.defineProperties(
      {},
      {
        ...Object.getOwnPropertyDescriptors(oldWindowLocation),
        assign: { configurable: true, value: jest.fn() },
      },
    );
  });

  afterEach(() => {
    app?.stop();
    jest.clearAllMocks();
  });

  describe('Basic behavior', () => {
    it('initial load of controller', async () => {
      await setup();
      const tabsReady = jest.spyOn(document, 'dispatchEvent');
    });

    it.only('selecting a tab on click (with animate class)', async () => {
      await setup();

      const tab1 = document.getElementById('tab-1');
      const tab2 = document.getElementById('tab-2');

      const tab1Panel = document.getElementById('tab-panel-1');
      const tab2Panel = document.getElementById('tab-panel-2');

      tab2.click();
      await jest.runAllTimersAsync();

      expect(tab1.getAttribute('aria-selected')).toBe('false');
      expect(tab2.getAttribute('aria-selected')).toBe('true');

      expect(tab1Panel.hidden).toBeTruthy();
      expect(tab2Panel.className).toContain('animate-in');
    });

    describe('selecting tab with keyboard', () => {
      it('should switch to right tab on right arrow key press', async () => {
        await setup();

        const tab1 = document.getElementById('tab-1');
        const tab2 = document.getElementById('tab-2');

        tab1.focus();
        simulateKeydown('ArrowRight');
        await jest.runAllTimersAsync();

        expect(tab2.getAttribute('aria-selected')).toBe('true');
      });

      it('should switch to left tab on left arrow key presss', async () => {
        await setup();

        const tab1 = document.getElementById('tab-1');
        const tab2 = document.getElementById('tab-2');

        tab2.focus();
        simulateKeydown('ArrowLeft');
        await jest.runAllTimersAsync();

        expect(tab1.getAttribute('aria-selected')).toBe('true');
      });

      it('should focus first tab on home key press', async () => {
        await setup();

        const tab1 = document.getElementById('tab-1');
        const tab2 = document.getElementById('tab-2');

        tab2.focus();
        simulateKeydown('Home');
        await jest.runAllTimersAsync();

        expect(tab1).toBe(document.activeElement);
      });

      it('should focus first tab on end key press', async () => {
        await setup();

        const tab1 = document.getElementById('tab-1');
        const tab3Label = document.getElementById('tab-label-tab-3');

        tab1.focus();
        simulateKeydown('End');
        await jest.runAllTimersAsync();

        expect(tab3Label).toBe(document.activeElement);
      });
    });
  });

  describe('Loading with an activated tab', () => {
    it('Loading with first tab selected on initial load', async () => {
      window.location.hash = '';

      await setup();

      const label = document.getElementById('tab-1');
      expect(label.getAttribute('aria-selected')).toBe('true');
      expect(label.tabIndex).toBe(0); // Ensure first tab is focusable
    });

    it.skip('loading with a different selected tab', async () => {
      await setup(`
      <div class="w-tabs" data-controller="w-tabs" data-w-tabs-selected-value="tab-tab-2" data-w-sync-location-hash-value="true">
        <div role="tablist">
          <a id="tab-1" href="#tab-panel-1" role="tab" tabindex="-1" data-action="w-tabs#select:prevent" data-w-tabs-target="tab">
            Tab 1
          </a>
          <a id="tab-2" href="#tab-panel-2" role="tab" tabindex="-1" data-action="w-tabs#select:prevent" data-w-tabs-target="tab">
            Tab 2
          </a>
        </div>
        <div class="tab-content tab-content--comments-enabled">
          <section id="tab-panel-1" role="tabpanel" aria-labelledby="tab-1" data-w-tabs-target="panel">
            tab-1
          </section>
          <section id="tab-panel-2" role="tabpanel" aria-labelledby="tab-2" data-w-tabs-target="panel">
            tab-2
          </section>
        </div>
      </div>
    `);
      const tab2 = document.querySelector('#tab-label-tab-2');
      const tab2Panel = document.querySelector('#tab-tab-2');
      const tab1Panel = document.querySelector('#tab-tab-1');

      await jest.runAllTimersAsync();
      expect(window.location.hash).toBe('#tab-tab-2');
      expect(tab2.getAttribute('aria-selected')).toBe('true');
      expect(tab2Panel.hidden).toBeFalsy();
      expect(tab1Panel.hidden).toBeTruthy();
    });

    it('Loading with a tab selected by the URL', async () => {
      window.location.hash = '#tab-tab-2';
      await setup();
      await jest.runAllTimersAsync();
      const tab2 = document.querySelector('#tab-label-tab-2');
      const tab2Panel = document.querySelector('#tab-tab-2');
      const tab1Panel = document.querySelector('#tab-tab-1');

      expect(window.location.hash).toBe('#tab-tab-2');

      // await jest.runAllTimersAsync();

      expect(tab2.getAttribute('aria-selected')).toBe('true');
      expect(tab2Panel.hidden).toBeFalsy();
      expect(tab1Panel.hidden).toBeTruthy();
    });
  });

  describe('Validating of malformed aria attributes', () => {
    beforeEach(() => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      // eslint-disable-next-line no-console
      console.warn.mockRestore();
    });

    it('warns about role="tablist" aria attributes', async () => {
      await setup(`
      <div class="w-tabs" data-controller="w-tabs">
        <div>
          <a id="tab-1" href="#tab-panel-1" role="tab" tabindex="-1" data-w-tabs-target="tab" data-action="w-tabs#select:prevent">
            Cheese
          </a>
          <a id="tab-2" href="#tab-panel-2" role="tab" data-w-tabs-target="tab" data-action="w-tabs#select:prevent">
            Chocolate
          </a>
          <a id="tab-3" href="#tab-panel-3" role="tab" data-w-tabs-target="tab" data-action="w-tabs#select:prevent">
            Coffee
          </a>
        </div>
        <div class="tab-content tab-content--comments-enabled">
          <section id="tab-panel-1" class="w-tabs__panel" role="tabpanel" aria-labelledby="tab-1" data-w-tabs-target="panel">
            All about cheese
          </section>
          <section id="tab-panel-2" class="w-tabs__panel" role="tabpanel" aria-labelledby="tab-2" data-w-tabs-target="panel">
            All about chocolate
          </section>
          <section id="tab-panel-3" class="w-tabs__panel" role="tabpanel" aria-labelledby="tab-3" data-w-tabs-target="panel">
            All about coffee
          </section>
        </div>
      </div>
      `);
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalled();
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalledWith(
        [...document.querySelector('.w-tabs__list').children],
        "One or more tab (label) targets are not direct descendants of an element with `role='tablist'`.",
      );
    });

    it('warns about role="tab" aria attributes', async () => {
      await setup(`
      <div class="w-tabs" data-controller="w-tabs">
        <div role="tablist">
          <a id="tab-1" href="#tab-panel-1" role="tab" data-action="w-tabs#select:prevent" data-w-tabs-target="tab">
            Cheese
          </a>
          <a id="tab-2" href="#tab-panel-2" data-action="w-tabs#select:prevent" data-w-tabs-target="tab">
            Chocolate
          </a>
          <a id="tab-3" href="#tab-panel-3" data-action="w-tabs#select:prevent" data-w-tabs-target="tab">
            Coffee
          </a>
        </div>
        <div class="tab-content tab-content--comments-enabled">
          <section id="tab-panel-1" class="w-tabs__panel" role="tabpanel" aria-labelledby="tab-1" data-w-tabs-target="panel">
            All about cheese
          </section>
          <section id="tab-panel-2" class="w-tabs__panel" role="tabpanel" aria-labelledby="tab-2" data-w-tabs-target="panel">
            All about chocolate
          </section>
          <section id="tab-panel-3" class="w-tabs__panel" role="tabpanel" aria-labelledby="tab-3" data-w-tabs-target="panel">
            All about coffee
          </section>
        </div>
      </div>
      `);
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalledTimes(2);
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenNthCalledWith(
        1,
        document.getElementById('tab-2'),
        "Tab nav elements must have the `role='tab'` attribute set",
      );
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenNthCalledWith(
        2,
        document.getElementById('tab-label-tab-3'),
        "Tab nav elements must have the `role='tab'` attribute set",
      );
    });

    it('warns about role="tabpanel" aria attributes', async () => {
      await setup(`
        <div class="w-tabs" data-controller="w-tabs">
          <div role="tablist">
            <a id="tab-1" href="#tab-panel-1" role="tab" data-action="w-tabs#select:prevent" data-w-tabs-target="tab">
              Cheese
            </a>
            <a id="tab-2" href="#tab-panel-2" role="tab" data-action="w-tabs#select:prevent" data-w-tabs-target="tab">
              Chocolate
            </a>
            <a id="tab-3" href="#tab-panel-3" role="tab" data-action="w-tabs#select:prevent" data-w-tabs-target="tab">
              Coffee
            </a>
          </div>
          <div class="tab-content tab-content--comments-enabled">
            <section id="tab-panel-1" aria-labelledby="tab-1" data-w-tabs-target="panel">
              All about cheese
            </section>
            <section id="tab-panel-2" role="tabpanel" aria-labelledby="tab-2" data-w-tabs-target="panel">
              All about chocolate
            </section>
            <section id="tab-panel-3" role="tabpanel" aria-labelledby="tab-3" data-w-tabs-target="panel">
              All about coffee
            </section>
          </div>
        </div>
      `);
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalled();
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalledWith(
        document.getElementById('tab-tab-1'),
        "Tab panel elements must have the `role='tabpanel'` attribute set.",
      );
    });

    it('warns about aria-labelledby', async () => {
      await setup(`
        <div class="w-tabs" data-controller="w-tabs">
          <div role="tablist">
            <a id="tab-1" href="#tab-panel-1" role="tab" tabindex="-1" data-action="w-tabs#select:prevent" data-w-tabs-target="tab">
              Cheese
            </a>
            <a id="tab-2" href="#tab-panel-2" role="tab" data-action="w-tabs#select:prevent" data-w-tabs-target="tab">
              Chocolate
            </a>
            <a id="tab-3" href="#tab-panel-3" role="tab" data-action="w-tabs#select:prevent" data-w-tabs-target="tab">
              Coffee
            </a>
          </div>
          <div class="tab-content tab-content--comments-enabled">
            <section id="tab-panel-1" role="tabpanel" aria-labelledby="tab-1" data-w-tabs-target="panel">
              All about cheese
            </section>
            <section id="tab-panel-2" role="tabpanel" aria-labelledby="tab-2" data-w-tabs-target="panel">
              All about chocolate
            </section>
            <section id="tab-panel-3" role="tabpanel" data-w-tabs-target="panel">
              All about coffee
            </section>
          </div>
        </div>
      `);
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalled();
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalledWith(
        document.getElementById('tab-tab-3'),
        'Tab panel element must have `aria-labelledby` set to the id of the tab nav element.',
      );
    });
  });
});
