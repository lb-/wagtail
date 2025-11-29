describe('privacy-switch entrypoint', () => {
  let trigger;
  let modalOptions;

  beforeEach(() => {
    document.body.innerHTML = `
      <button data-a11y-dialog-show="set-privacy" data-url="/set-privacy/">Set privacy</button>
    `;

    // Stub ModalWorkflow to capture options
    window.ModalWorkflow = jest.fn((opts) => {
      modalOptions = opts;
    });

    // Import the module under test (after globals and DOM are ready)
    jest.isolateModules(() => {
      require('./privacy-switch');
    });

    trigger = document.querySelector('[data-a11y-dialog-show="set-privacy"]');
  });

  afterEach(() => {
    modalOptions = undefined;
    document.body.innerHTML = '';
    delete window.ModalWorkflow;
  });

  it('should open the ModalWorkflow with the expected options on click', () => {
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');

    trigger.dispatchEvent(clickEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(window.ModalWorkflow).toHaveBeenCalledTimes(1);
    expect(modalOptions.dialogId).toBe('set-privacy');
    expect(modalOptions.url).toBe('/set-privacy/');
    expect(typeof modalOptions.onload.set_privacy).toBe('function');
    expect(typeof modalOptions.onload.set_privacy_done).toBe('function');
  });

  // Migrated by an AI Narwhal and I have not reviewed this code yet
  it('should wire form submit to modal.postForm in set_privacy', () => {
    const form = document.createElement('form');
    form.action = '/submit/';
    document.body.appendChild(form);
    const modal = { body: document.body, postForm: jest.fn() };

    trigger.click();
    modalOptions.onload.set_privacy(modal);

    const submitEvent = new Event('submit', {
      bubbles: true,
      cancelable: true,
    });
    const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');
    form.dispatchEvent(submitEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(modal.postForm).toHaveBeenCalledTimes(1);
    expect(modal.postForm).toHaveBeenCalledWith('/submit/', expect.any(String));
  });

  it('should dispatch w-privacy:changed and close the modal in set_privacy_done', () => {
    const close = jest.fn();
    const modal = { close };
    const listener = jest.fn();
    document.addEventListener('w-privacy:changed', listener);

    trigger.click();
    modalOptions.onload.set_privacy_done(modal, { is_public: true });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { isPublic: true },
      }),
    );
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('should handle missing data-url attribute gracefully', () => {
    document.body.innerHTML = `
      <button data-a11y-dialog-show="set-privacy">Set privacy</button>
    `;

    jest.isolateModules(() => {
      require('./privacy-switch');
    });

    const triggerWithoutUrl = document.querySelector(
      '[data-a11y-dialog-show="set-privacy"]',
    );
    triggerWithoutUrl.click();

    expect(window.ModalWorkflow).not.toHaveBeenCalled();
  });

  it('should handle missing form in modal body gracefully', () => {
    const modal = { body: document.createElement('div'), postForm: jest.fn() };

    trigger.click();
    modalOptions.onload.set_privacy(modal);

    // Should not throw an error even though there's no form
    expect(modal.postForm).not.toHaveBeenCalled();
  });

  it('should handle multiple triggers on the same page', () => {
    document.body.innerHTML = `
      <button data-a11y-dialog-show="set-privacy" data-url="/privacy-1/">Privacy 1</button>
      <button data-a11y-dialog-show="set-privacy" data-url="/privacy-2/">Privacy 2</button>
    `;

    jest.isolateModules(() => {
      require('./privacy-switch');
    });

    const triggers = document.querySelectorAll(
      '[data-a11y-dialog-show="set-privacy"]',
    );

    triggers[0].click();
    expect(window.ModalWorkflow).toHaveBeenCalledTimes(1);
    expect(modalOptions.url).toBe('/privacy-1/');

    triggers[1].click();
    expect(window.ModalWorkflow).toHaveBeenCalledTimes(2);
    expect(modalOptions.url).toBe('/privacy-2/');
  });

  it('should use form action attribute when available', () => {
    const form = document.createElement('form');
    form.setAttribute('action', '/relative-path/');
    document.body.appendChild(form);
    const modal = { body: document.body, postForm: jest.fn() };

    trigger.click();
    modalOptions.onload.set_privacy(modal);

    const submitEvent = new Event('submit', {
      bubbles: true,
      cancelable: true,
    });
    form.dispatchEvent(submitEvent);

    expect(modal.postForm).toHaveBeenCalledWith(
      '/relative-path/',
      expect.any(String),
    );
  });
});
