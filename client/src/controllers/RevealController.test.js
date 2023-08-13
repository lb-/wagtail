import { Application } from '@hotwired/stimulus';

import { RevealController } from './RevealController';

jest.useFakeTimers();

describe('RevealController', () => {
  const eventNames = [
    'w-reveal:closed',
    'w-reveal:opened',
    'w-reveal:ready',
    'w-reveal:toggled',
  ];

  const events = {};

  let application;
  let errors = [];

  beforeAll(() => {
    eventNames.forEach((name) => {
      events[name] = [];
    });

    Object.keys(events).forEach((name) => {
      document.addEventListener(name, (event) => {
        events[name].push(event);
      });
    });
  });

  const setup = async (
    html = `
    <section data-controller="w-reveal">
      <button type="button" data-action="w-reveal#toggle" data-w-reveal-target="toggle" aria-controls="my-content">Toggle</button>
      <div class="content" id="my-content">CONTENT</div>
    </section>
    `,
    identifier = 'w-reveal',
  ) => {
    document.body.innerHTML = `<main>${html}</main>`;

    application = new Application();

    application.handleError = (error, message) => {
      errors.push({ error, message });
    };

    application.register(identifier, RevealController);

    application.start();

    await jest.runAllTimersAsync();

    return [
      ...document.querySelectorAll(`[data-controller~="${identifier}"]`),
    ].map((element) =>
      application.getControllerForElementAndIdentifier(element, identifier),
    );
  };

  afterEach(() => {
    application?.stop && application.stop();
    errors = [];
    eventNames.forEach((name) => {
      events[name] = [];
    });
  });

  describe('when connecting to the DOM', () => {
    it('should attach the aria-controls target from the toggle as the content target if not set', async () => {
      const [controller] = await setup();
      expect(controller.contentTarget).toEqual(
        document.getElementById('my-content'),
      );
    });

    it('should allow for a class to set the initial state of closed', async () => {
      await setup(`
      <section class="w-reveal collapsed" data-controller="w-reveal" data-w-reveal-closed-class="collapsed">
        <button type="button" data-w-reveal-target="toggle" aria-controls="my-content">Toggle</button>
        <div id="my-content">CONTENT</div>
      </section>
      `);

      expect(
        document.querySelector('button').getAttribute('aria-expanded'),
      ).toBe('false');

      expect(
        document
          .querySelector('section')
          .getAttribute('data-w-reveal-closed-value'),
      ).toEqual('true');
    });

    it("should allow for the toggle's aria-expanded attribute to set the initial state of closed", async () => {
      await setup(`
      <section class="w-reveal" data-controller="w-reveal">
        <button type="button" data-w-reveal-target="toggle" aria-controls="my-content" aria-expanded="false">Toggle</button>
        <div id="my-content">CONTENT</div>
      </section>
      `);

      expect(
        document.querySelector('button').getAttribute('aria-expanded'),
      ).toBe('false');

      expect(
        document
          .querySelector('section')
          .getAttribute('data-w-reveal-closed-value'),
      ).toEqual('true');
    });

    it('should ignore class usage for initial state of closed if aria-expanded is true', async () => {
      await setup(`
      <section class="w-reveal collapsed" data-controller="w-reveal" data-w-reveal-closed-class="collapsed">
        <button type="button" data-w-reveal-target="toggle" aria-controls="my-content" aria-expanded="true">Toggle</button>
        <div id="my-content">CONTENT</div>
      </section>
      `);

      expect(
        document.querySelector('button').getAttribute('aria-expanded'),
      ).toBe('true');

      expect(
        document
          .querySelector('section')
          .getAttribute('data-w-reveal-closed-value'),
      ).toEqual(null);
    });
  });

  describe('basic functionality', () => {
    it('should toggle the content when the toggle button is clicked', async () => {
      expect(Object.values(events).flat()).toHaveLength(0);

      await setup();

      expect(events['w-reveal:ready']).toHaveLength(1);
      expect(events['w-reveal:toggled']).toHaveLength(0);

      const content = document.getElementById('my-content');
      const toggleButton = document.querySelector('button');

      expect(toggleButton.getAttribute('aria-expanded')).toEqual('true');
      expect(content.hidden).toEqual(false);

      await Promise.resolve(toggleButton.click());

      expect(toggleButton.getAttribute('aria-expanded')).toEqual('false');
      expect(content.hidden).toEqual(true);
      expect(events['w-reveal:toggled']).toHaveLength(1);

      await Promise.resolve(toggleButton.click());

      expect(toggleButton.getAttribute('aria-expanded')).toEqual('true');
      expect(content.hidden).toEqual(false);
      expect(events['w-reveal:toggled']).toHaveLength(2);

      expect(events['w-reveal:ready']).toHaveLength(1); // should only dispatch once
    });

    it('should allow for an explicit open and close action', async () => {
      await setup(`
    <section data-controller="w-reveal">
      <button type="button" data-w-reveal-target="toggle" aria-controls="content">Toggle</button>
      <div data-w-reveal-target="controls">
        <button id="open" type="button" data-action="w-reveal#open">open</button>
        <button id="close" type="button" data-action="w-reveal#close">close</button>
      </div>
      <div id="content">CONTENT</div>
    </section>
      `);

      const content = document.getElementById('content');
      expect(content.hidden).toEqual(false);

      await Promise.resolve(document.getElementById('close').click());

      expect(content.hidden).toEqual(true);

      document.getElementById('open').click();
      await Promise.resolve();

      expect(content.hidden).toEqual(false);
    });

    it('should support hidden until found if the browser supports it', async () => {
      document.body.onbeforematch = jest.fn();

      await setup();

      await Promise.resolve(document.querySelector('button').click());

      const content = document.querySelector('.content');

      expect(content.getAttribute('hidden')).toEqual('until-found');
    });

    it('should update classes when opened/closed', async () => {
      await setup(`
      <section
        class="container remove-me-when-connected"
        id="section"
        data-controller="w-reveal"
        data-w-reveal-close-icon-class="icon-collapse"
        data-w-reveal-closed-class="collapsed"
        data-w-reveal-closed-value="true"
        data-w-reveal-initial-class="remove-me-when-connected"
        data-w-reveal-open-icon-class="icon-expand"
        data-w-reveal-opened-class="open--container"
        data-w-reveal-opened-content-class="show-max-width"
      >
        <button type="button" data-w-reveal-target="toggle" data-action="w-reveal#toggle">
          Show/Hide
          <svg class="icon icon-expand" aria-hidden="true">
            <use href="#icon-expand"></use>
          </svg>
        </button>
        <ul>
          <li class="item" data-w-reveal-target="content">CONTENT A</li>
          <li class="item" data-w-reveal-target="content">CONTENT B</li>
          <li class="item" data-w-reveal-target="content">CONTENT C</li>
        </ul>
      </section>
        `);

      const icon = document.querySelector('.icon');
      const useElement = icon.querySelector('use');

      // initially closed
      expect(document.getElementById('section').className).toEqual(
        'container collapsed', // should not have 'remove-me-when-connected'
      );
      expect(
        [...document.querySelectorAll('li')].every(
          (li) => li.className === 'item',
        ),
      ).toBe(true);
      expect([...icon.classList]).toEqual(['icon', 'icon-expand']);
      expect(useElement.getAttribute('href')).toEqual('#icon-expand');

      // now open and check classes

      await Promise.resolve(document.querySelector('button').click());

      expect(document.getElementById('section').className).toEqual(
        'container open--container',
      );
      expect(
        [...document.querySelectorAll('li')].every(
          (li) => li.className === 'item show-max-width',
        ),
      ).toBe(true);
      expect([...icon.classList]).toEqual(['icon', 'icon-collapse']);
      expect(useElement.getAttribute('href')).toEqual('#icon-collapse');
    });

    it('should resolve an icon class based on initial state via the DOM if not set', async () => {
      await setup(`
      <section class="container" id="section" data-controller="w-reveal" data-w-reveal-open-icon-class="icon-down-chevron">
        <button type="button" data-w-reveal-target="toggle">
        <svg class="icon icon-placeholder w-reveal__icon" aria-hidden="true">
          <use href="#icon-placeholder"></use>
        </svg>
        </button>
        <ul data-w-reveal-target="content"><li class="item">CONTENT</li></ul>
      </section>
      `);

      // keep the open one set originally
      expect(
        document
          .getElementById('section')
          .getAttribute('data-w-reveal-open-icon-class'),
      ).toEqual('icon-down-chevron');

      // set the close one
      expect(
        document
          .getElementById('section')
          .getAttribute('data-w-reveal-close-icon-class'),
      ).toEqual('icon-placeholder');
    });

    it('should support dispatching on & updating toggles that are not in the controlled element scope', async () => {
      expect(Object.values(events).flat()).toHaveLength(0);

      await setup(`
      <main>
        <header>
          <button type="button" aria-controls="panel-red-content" data-w-reveal-target="toggle">Toggle</button>
          <button type="button" aria-controls="panel-blue-content" data-w-reveal-target="toggle">Toggle</button>
        </header>
        <aside class="container" id="panel-red" data-controller="w-reveal">
          <button type="button" aria-controls="panel-red-content" data-w-reveal-target="toggle" data-action="w-reveal#toggle">Toggle</button>
          <div data-w-reveal-target="content" id="panel-red-content">CONTENT</div>
        </aside>
        <aside class="container" id="panel-blue" data-controller="w-reveal">
          <button type="button" aria-controls="panel-blue-content" data-w-reveal-target="toggle" data-action="w-reveal#toggle">Toggle</button>
          <div data-w-reveal-target="content" id="panel-blue-content">CONTENT</div>
        </aside>
      </main>
      `);

      expect(events['w-reveal:ready']).toHaveLength(2);
      expect(events['w-reveal:toggled']).toHaveLength(0);

      const allToggles = Array.from(document.querySelectorAll('button'));
      expect(allToggles).toHaveLength(4);
      allToggles.forEach((toggle) => {
        expect(toggle.getAttribute('aria-expanded')).toEqual('true');
      });

      document.getElementById('panel-blue').firstElementChild.click();
      await Promise.resolve();

      expect(
        allToggles.map((toggle) => toggle.getAttribute('aria-expanded')),
      ).toEqual(['true', 'false', 'true', 'false']);

      document.getElementById('panel-red').firstElementChild.click();
      await Promise.resolve();

      expect(
        allToggles.map((toggle) => toggle.getAttribute('aria-expanded')),
      ).toEqual(['false', 'false', 'false', 'false']);
    });
  });

  describe('when events are dispatched and have their default prevented', () => {
    it('should allow the blocking of closing', async () => {
      await setup();

      const button = document.querySelector('button');
      expect(button.getAttribute('aria-expanded')).toEqual('true');

      // check first that the button closes once normally
      await Promise.resolve(button.click());
      expect(button.getAttribute('aria-expanded')).toEqual('false');

      // re-open
      await Promise.resolve(button.click());
      expect(button.getAttribute('aria-expanded')).toEqual('true');

      // now prevent the closing the second time
      document.addEventListener(
        'w-reveal:closing',
        (event) => {
          event.preventDefault();
        },
        { once: true },
      );

      await Promise.resolve(button.click());
      expect(button.getAttribute('aria-expanded')).toEqual('true');
    });

    it('should allow the blocking of opening', async () => {
      await setup();

      const button = document.querySelector('button');
      expect(button.getAttribute('aria-expanded')).toEqual('true');

      // close it so we can stop the opening
      await Promise.resolve(button.click());
      expect(button.getAttribute('aria-expanded')).toEqual('false');

      // prevent the opening
      document.addEventListener(
        'w-reveal:opening',
        (event) => {
          event.preventDefault();
        },
        { once: true },
      );

      await Promise.resolve(button.click());
      expect(button.getAttribute('aria-expanded')).toEqual('false');
    });
  });

  describe('when the correct HTML is not provided', () => {
    let consoleLogMock;

    beforeAll(() => {
      // Avoid expected errors/logs to bubble to the Jest logs.
      consoleLogMock = jest.spyOn(console, 'log').mockImplementation();
    });

    afterAll(() => {
      consoleLogMock.mockRestore();
    });

    it('should throw an error if no toggle target element is set', async () => {
      await setup(
        `<section data-controller="w-reveal"></section><section data-controller="w-reveal"></section>`,
      );

      expect(errors).toHaveProperty(
        '0.error.message',
        'Missing target element "toggle" for "w-reveal" controller',
      );
      expect(errors).toHaveProperty(
        '0.message',
        'Error initializing controller',
      );

      expect(errors.length).toBeTruthy();
    });

    it('should throw an error if no valid content target element can be found', async () => {
      await setup(
        `<section data-controller="w-reveal">
        <button type="button" data-w-reveal-target="toggle">Open</button>
      </section>`,
      );

      expect(errors).toHaveProperty(
        '0.error.message',
        'data-w-reveal-target="content" must be set or aria-controls must target a valid element.',
      );
      expect(errors).toHaveProperty(
        '0.message',
        'Error initializing controller',
      );
    });

    it('should throw an error if no valid content target element can be found when using aria-controls', async () => {
      await setup(
        `<section data-controller="w-reveal">
        <button type="button" data-w-reveal-target="toggle" aria-controls="missing">Open</button>
      </section>`,
      );

      expect(errors).toHaveProperty(
        '0.error.message',
        'data-w-reveal-target="content" must be set or aria-controls must target a valid element.',
      );
      expect(errors).toHaveProperty(
        '0.message',
        'Error initializing controller',
      );
    });
  });

  describe('when the peek capability is set', () => {
    // keep application throughout this test block so we can break up tests into steps
    let keepApplication;

    afterAll(() => {
      keepApplication?.stop();
    });

    const getIconInfo = () =>
      Array.from(document.querySelectorAll('svg,svg > use')).map(
        (element) =>
          [...element.classList].join(' ') || element.getAttribute('href'),
      );

    it('should use the initial state set for the controller', async () => {
      await setup(
        `
      <header>
        <div
          class="w-breadcrumb collapsed"
          data-controller="w-breadcrumb"
          data-w-breadcrumb-close-icon-class="icon-cross"
          data-w-breadcrumb-closed-value="true"
          data-w-breadcrumb-open-icon-class="icon-breadcrumb-expand"
          data-w-breadcrumb-opened-content-class="w-max-w-4xl"
          data-w-breadcrumb-peek-target-value="header"
        >
          <button
            type="button"
            class="w-flex w-items-center"
            aria-expanded="false"
            data-w-breadcrumb-target="toggle"
            data-action="w-breadcrumb#toggle mouseenter->w-breadcrumb#peek"
          >
            <svg class="icon icon-breadcrumb-expand" aria-hidden="true">
              <use href="#icon-breadcrumb-expand"></use>
            </svg>
          </button>
          <ol>
            <li class="item" data-w-breadcrumb-target="content" hidden>
              Breadcrumb item 1
            </li>
            <li class="item" data-w-breadcrumb-target="content" hidden>
              Breadcrumb item 2
            </li>
            <li class="item" data-w-breadcrumb-target="content" hidden>
              Breadcrumb item 3
            </li>
          </ol>
        </div>
      </header>
      `,
        'w-breadcrumb',
      );

      keepApplication = application;
      application = {};

      // checks for initial closed state
      const allItemsHidden = [...document.querySelectorAll('li')].every(
        ({ hidden }) => hidden,
      );
      expect(allItemsHidden).toEqual(true);
      expect(getIconInfo()).toEqual([
        'icon icon-breadcrumb-expand',
        '#icon-breadcrumb-expand',
      ]);
    });

    it('should act as open but not change the icon when peeking', async () => {
      await Promise.resolve(
        document
          .querySelector('button')
          .dispatchEvent(new MouseEvent('mouseenter')),
      );

      // should act as open but not change the icon once peek enabled
      const allItemsVisible = [...document.querySelectorAll('li')].every(
        ({ hidden }) => !hidden,
      );

      expect(getIconInfo()).toEqual([
        'icon icon-breadcrumb-expand',
        '#icon-breadcrumb-expand',
      ]);

      expect(allItemsVisible).toEqual(true);

      // confirm peeking is set
      expect(
        document
          .querySelector('.w-breadcrumb')
          .getAttribute('data-w-breadcrumb-peeking-value'),
      ).toEqual('true');
    });

    it('should stop peeking when mouseleave is called on the peek target', async () => {
      await Promise.resolve(
        document
          .querySelector('header')
          .dispatchEvent(new MouseEvent('mouseleave')),
      );

      const allItemsHidden = [...document.querySelectorAll('li')].every(
        ({ hidden }) => hidden,
      );

      expect(allItemsHidden).toEqual(true);

      expect(getIconInfo()).toEqual([
        'icon icon-breadcrumb-expand',
        '#icon-breadcrumb-expand',
      ]);

      // confirm peeking is unset
      expect(
        document
          .querySelector('.w-breadcrumb')
          .getAttribute('data-w-breadcrumb-peeking-value'),
      ).toEqual('false');
    });

    it('should stop peeking when already peeking & toggle is called, changing the icon but keeping open', async () => {
      await Promise.resolve(
        document
          .querySelector('button')
          .dispatchEvent(new MouseEvent('mouseenter')),
      );

      // should act as open but not change the icon once peek enabled
      const allItemsVisible = [...document.querySelectorAll('li')].every(
        ({ hidden }) => !hidden,
      );

      expect(getIconInfo()).toEqual([
        'icon icon-breadcrumb-expand',
        '#icon-breadcrumb-expand',
      ]);

      expect(allItemsVisible).toEqual(true);

      // now click toggle

      await Promise.resolve(document.querySelector('button').click());

      expect(allItemsVisible).toEqual(true);
      expect(getIconInfo()).toEqual(['icon icon-cross', '#icon-cross']);

      // confirm peeking is unset
      expect(
        document
          .querySelector('.w-breadcrumb')
          .getAttribute('data-w-breadcrumb-peeking-value'),
      ).toEqual('false');

      const previousHTML = document.querySelector('header').outerHTML;

      // mouseleave on peek target should not do anything now
      await Promise.resolve(
        document
          .querySelector('header')
          .dispatchEvent(new MouseEvent('mouseleave')),
      );

      expect(document.querySelector('header').outerHTML).toEqual(previousHTML);
    });
  });
});
