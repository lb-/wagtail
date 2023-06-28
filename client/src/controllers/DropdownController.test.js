import { Application } from '@hotwired/stimulus';
import { DropdownController } from './DropdownController';

describe('DropdownController', () => {
  let application;

  beforeAll(() => {
    application?.stop();

    document.body.innerHTML = `
<div data-controller="w-dropdown">
  <button type="button" data-w-dropdown-target="toggle" aria-label="Actions"></button>
  <div data-w-dropdown-target="content">
    <a href="/">Option</a>
  </div>
</div>`;

    application = Application.start();
    application.register('w-dropdown', DropdownController);
  });

  beforeEach(() => {
    // JSdom does not yet dispatch transitoinend events, so we mock it here.
    // https://github.com/jsdom/jsdom/issues/1781

    const addEventListenerOriginal =
      window.HTMLDivElement.prototype.addEventListener;

    jest
      .spyOn(window.HTMLDivElement.prototype, 'addEventListener')
      .mockImplementation(function addEventListener(..._) {
        const [eventName, callback] = _;
        // mock an instant transition
        if (eventName === 'transitionend') callback({ target: this });
        return addEventListenerOriginal(..._);
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('initialises Tippy.js on connect', () => {
    const toggle = document.querySelector('[data-w-dropdown-target="toggle"]');
    const content = document.querySelector(
      '[data-w-dropdown-target="content"]',
    );
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(content).toBe(null);
  });

  it('triggers custom event on activation', async () => {
    const toggle = document.querySelector('[data-w-dropdown-target="toggle"]');

    const mock = new Promise((resolve) => {
      document.addEventListener('w-dropdown:shown', (event) => {
        resolve(event);
      });
    });

    toggle.dispatchEvent(new Event('click'));

    const event = await mock;

    expect(event).toEqual(
      expect.objectContaining({ type: 'w-dropdown:shown', target: document }),
    );
  });
});
