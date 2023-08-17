import { Application } from '@hotwired/stimulus';
import { SignalController } from './SignalController';

describe('SignalController', () => {
  let application;

  const setup = async (
    html = `
    <button
      id="button"
      type="button"
      data-controller="w-signal"
      data-action="w-signal#send"
      data-w-signal-target-value="#target"
    >
      SEND
    </button>
    <div id="target">TARGET</div>`,
    identifier = 'w-signal',
  ) => {
    document.body.innerHTML = `<main>${html}</main>`;

    application = new Application();
    application.register(identifier, SignalController);
    application.start();

    await Promise.resolve();
  };

  afterEach(() => {
    application?.stop();
    jest.clearAllMocks();
  });

  describe('send method', () => {
    it('should dispatch a default event when clicked', async () => {
      const handleEvent = jest.fn();

      await setup();

      document
        .getElementById('target')
        .addEventListener('w-signal:sent', handleEvent);

      expect(handleEvent).not.toHaveBeenCalled();

      document.getElementById('button').click();

      expect(handleEvent).toHaveBeenCalled();
    });

    it('should support sending an event that does not bubble', async () => {
      const handleEvent = jest.fn();

      await setup();

      document.addEventListener('w-signal:sent', handleEvent);

      document
        .getElementById('target')
        .addEventListener('w-signal:sent', handleEvent);

      const button = document.getElementById('button');

      button.setAttribute('data-w-signal-bubbles-value', 'false');

      expect(handleEvent).not.toHaveBeenCalled();

      document.getElementById('button').click();

      expect(handleEvent).toHaveBeenCalledTimes(1);
    });

    it('should dispatch a an event to custom declared targets (via action param or event detail)', async () => {
      const handleEvent = jest.fn();

      await setup(`
      <button
        id="button"
        type="button"
        data-controller="w-signal"
        data-action="w-signal#send some-event->w-signal#send"
        data-w-signal-target-param="#other-button"
      >
        Button
      </button>
      <button id="other-button" type="button">Other button</button>
      <button id="third-button" type="button">Third button</button>
      `);

      document.addEventListener('w-signal:sent', handleEvent);

      document.getElementById('button').click();

      expect(handleEvent).toHaveBeenCalledTimes(1);
      expect(handleEvent.mock.calls[0][0].target).toEqual(
        document.getElementById('other-button'),
      );

      document.getElementById('button').dispatchEvent(
        new CustomEvent('some-event', {
          detail: { target: '#third-button' },
        }),
      );

      expect(handleEvent).toHaveBeenCalledTimes(2);
      expect(handleEvent.mock.calls[1][0].target).toEqual(
        document.getElementById('third-button'),
      );
    });

    it('should support sending to multiple elements based on the target', async () => {
      const handleEvent = jest.fn();

      await setup(`
        <button
          id="button"
          type="button"
          data-controller="w-signal"
          data-action="w-signal#send"
          data-w-signal-bubbles-value="true"
          data-w-signal-target-param="li"
        >
          Button
        </button>
        <ul>
          <li id="a">A</li>
          <li id="b">B</li>
          <li id="c">C</li>
        </ul>
        `);

      document.addEventListener('w-signal:sent', handleEvent);

      document.getElementById('button').click();

      expect(handleEvent).toHaveBeenCalledTimes(3);
      expect(handleEvent).toHaveBeenLastCalledWith(
        expect.objectContaining({
          target: document.getElementById('c'),
        }),
      );
    });

    it('should support sending an event with a custom name (via action param or event detail)', async () => {
      const handleEvent = jest.fn();

      await setup(`
      <button
        id="button"
        type="button"
        data-controller="w-signal"
        data-action="w-signal#send some-event->w-signal#send"
        data-w-signal-name-param="w-first:name"
      >
        Button
      </button>`);

      document.addEventListener('w-signal:sent', handleEvent);
      document.addEventListener('w-first:name', handleEvent);
      document.addEventListener('w-last:name', handleEvent);

      document.getElementById('button').click();

      expect(handleEvent).toHaveBeenCalledTimes(1);

      const [event1] = handleEvent.mock.calls[0];
      expect(event1.type).toEqual('w-first:name');
      expect(event1.target).toEqual(document.getElementById('button'));

      document.getElementById('button').dispatchEvent(
        new CustomEvent('some-event', {
          detail: { name: 'w-last:name' },
        }),
      );

      expect(handleEvent).toHaveBeenCalledTimes(2);

      const [event2] = handleEvent.mock.calls[1];
      expect(event2.type).toEqual('w-last:name');
      expect(event2.target).toEqual(document.getElementById('button'));
    });
  });
});
