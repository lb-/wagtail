import { Application } from '@hotwired/stimulus';

import { PanelController } from './PanelController';

jest.useFakeTimers();

describe('PanelController', () => {
  const eventNames = ['changed', 'closed', 'opened', 'ready'];
  const events = {};

  let application;
  let errors = [];

  beforeAll(() => {
    eventNames.forEach((name) => {
      events[name] = [];
    });

    Object.keys(events).forEach((name) => {
      document.addEventListener(`w-panel:${name}`, (event) => {
        events[name].push(event);
      });
    });
  });

  const setup = async (
    html = `
    <section data-controller="w-panel" data-w-panel-use-hidden-value>
      <button type="button" data-action="w-panel#toggle" data-w-panel-target="toggle" aria-controls="my-content" type="button">Toggle</button>
      <div id="my-content">CONTENT</div>
    </section>
    `,
  ) => {
    document.body.innerHTML = `<main>${html}</main>`;

    application = new Application();

    application.handleError = (error, message) => {
      errors.push({ error, message });
    };

    application.register('w-panel', PanelController);

    application.start();

    await Promise.resolve();

    return application.getControllerForElementAndIdentifier(
      document.querySelector('section'),
      'w-panel',
    );
  };

  afterEach(() => {
    application?.stop();
    errors = [];
    eventNames.forEach((name) => {
      events[name] = [];
    });
  });

  describe('when connecting to the DOM', () => {
    it('should attach the aria-controls target from the toggle as the content target if not set', async () => {
      const controller = await setup();
      expect(controller.contentTarget).toEqual(
        document.getElementById('my-content'),
      );
    });

    /**
     * should allow for a class to set the initial state of closed
     * should ignore the initial class usage for closing if an error is found
     * should ignore the initial class usage for closing if aria-expanded is not true
     * should support initial closed state via a value & update other content
     */
  });

  describe('basic functionality (including event dispatching)', () => {
    it('should toggle the content when the toggle button is clicked', async () => {
      expect(Object.values(events).flat()).toHaveLength(0);

      await setup();

      expect(events.ready).toHaveLength(1);

      const content = document.getElementById('my-content');
      const toggleButton = document.querySelector('button');

      expect(toggleButton.getAttribute('aria-expanded')).toEqual('true');
      expect(content.hidden).toEqual(false);

      await Promise.resolve(toggleButton.click());

      expect(toggleButton.getAttribute('aria-expanded')).toEqual('false');
      expect(content.hidden).toEqual(true);

      await Promise.resolve(toggleButton.click());

      expect(toggleButton.getAttribute('aria-expanded')).toEqual('true');
      expect(content.hidden).toEqual(false);
    });

    it('should allow for an explicit open and close action', async () => {
      await setup(`
    <section data-controller="w-panel" data-w-panel-use-hidden-value>
      <button type="button" data-w-panel-target="toggle" aria-controls="content" type="button">Toggle</button>
      <div data-w-panel-target="controls">
        <button id="open" type="button" data-action="w-panel#open">open</button>
        <button id="close" type="button" data-action="w-panel#close">close</button>
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
    /**
     * should allow for behaviour where the hidden value is not set but classes are used
     * should provide a suitable description with events
     * should allow provided classes for inner content on open
     * Should use the browser beforematch thing
     */
  });

  describe('when events are dispatched and have their default prevented', () => {
    it('should allow the blocking of closing', async () => {
      await setup();

      const button = document.querySelector('button');
      expect(button.getAttribute('aria-expanded')).toEqual('true');

      // check first that the button closes once normally
      await Promise.resolve(button.click());
      expect(button.getAttribute('aria-expanded')).toEqual('false');

      // re-open the panel
      await Promise.resolve(button.click());
      expect(button.getAttribute('aria-expanded')).toEqual('true');

      // now prevent the closing the second time
      document.addEventListener(
        'w-panel:closing',
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
        'w-panel:opening',
        (event) => {
          event.preventDefault();
        },
        { once: true },
      );

      await Promise.resolve(button.click());
      expect(button.getAttribute('aria-expanded')).toEqual('false');
    });
  });

  describe('when the scroll method is used to smooth scroll', () => {
    const scrollIntoView = jest.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView;

    const html = `
    <section data-controller="w-panel" id="scroll-to-panel">
      <button type="button" data-w-panel-target="toggle" aria-controls="my-content" type="button">Toggle</button>
      <div id="my-content">CONTENT</div>
      <button id="scroll" type="button" data-action="w-panel#scroll">Scroll</button>
    </section>
    `;

    it('should only scroll if the panel is the target based on the URL hash', async () => {
      await setup(html);

      expect(scrollIntoView).not.toHaveBeenCalled();

      const scrollButton = document.getElementById('scroll');

      scrollButton.click();

      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
      expect(scrollIntoView.mock.contexts[0]).toEqual(
        document.getElementById('scroll-to-panel'),
      );
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
      await setup(`<section data-controller="w-panel"></section>`);

      expect(errors).toHaveProperty(
        '0.error.message',
        'Missing target element "toggle" for "w-panel" controller',
      );
      expect(errors).toHaveProperty(
        '0.message',
        'Error initializing controller',
      );
    });

    it('should throw an error if no valid content target element can be found', async () => {
      await setup(
        `<section data-controller="w-panel">
        <button type="button" data-w-panel-target="toggle">Open</button>
      </section>`,
      );

      expect(errors).toHaveProperty(
        '0.error.message',
        'data-w-panel-target="content" must be set or aria-controls must target a valid element.',
      );
      expect(errors).toHaveProperty(
        '0.message',
        'Error initializing controller',
      );
    });

    it('should throw an error if no valid content target element can be found when using aria-controls', async () => {
      await setup(
        `<section data-controller="w-panel">
        <button type="button" data-w-panel-target="toggle" aria-controls="missing">Open</button>
      </section>`,
      );

      expect(errors).toHaveProperty(
        '0.error.message',
        'data-w-panel-target="content" must be set or aria-controls must target a valid element.',
      );
      expect(errors).toHaveProperty(
        '0.message',
        'Error initializing controller',
      );
    });
  });

  describe('supporting legacy data-panel when used with the identifier `w-panel`', () => {
    /**
     * should ...
     */
  });
});
