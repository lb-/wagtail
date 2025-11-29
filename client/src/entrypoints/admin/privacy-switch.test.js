/**
 * Mocks for the ModalWorkflow and related functions.
 * Each test uses jest.isolateModules to ensure fresh module imports.
 */
const mockClose = jest.fn();
const mockPostForm = jest.fn();

/**
 * Creates a ModalWorkflow mock that captures options for assertions.
 * @returns {object} Object containing the mock function and captured options
 */
function createModalWorkflowMock() {
  let capturedOptions;
  const mockFn = jest.fn((options) => {
    capturedOptions = options;
    return {
      close: mockClose,
      postForm: mockPostForm,
      body: {
        querySelector: () => null,
      },
    };
  });
  return {
    mock: mockFn,
    getOptions: () => capturedOptions,
  };
}

describe('privacy-switch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('click handler binding', () => {
    it('should bind click handler to privacy buttons', async () => {
      const { mock, getOptions } = createModalWorkflowMock();
      window.ModalWorkflow = mock;

      document.body.innerHTML = `
        <button id="privacy-btn" data-a11y-dialog-show="set-privacy" data-url="/privacy/"></button>
      `;

      // Import the module in isolation
      await jest.isolateModulesAsync(async () => {
        await import('./privacy-switch');
      });

      // Wait for domReady promise to resolve
      await Promise.resolve();

      const button = document.getElementById('privacy-btn');
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(mock).toHaveBeenCalledTimes(1);
      expect(getOptions()).toBeDefined();
    });

    it('should prevent default on click event', async () => {
      const { mock } = createModalWorkflowMock();
      window.ModalWorkflow = mock;

      document.body.innerHTML = `
        <button id="privacy-btn" data-a11y-dialog-show="set-privacy" data-url="/privacy/"></button>
      `;

      await jest.isolateModulesAsync(async () => {
        await import('./privacy-switch');
      });
      await Promise.resolve();

      const button = document.getElementById('privacy-btn');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      clickEvent.preventDefault = jest.fn();

      button.dispatchEvent(clickEvent);

      expect(clickEvent.preventDefault).toHaveBeenCalled();
    });

    it('should pass correct options to ModalWorkflow', async () => {
      const { mock } = createModalWorkflowMock();
      window.ModalWorkflow = mock;

      document.body.innerHTML = `
        <button id="privacy-btn" data-a11y-dialog-show="set-privacy" data-url="/custom/privacy/url/"></button>
      `;

      await jest.isolateModulesAsync(async () => {
        await import('./privacy-switch');
      });
      await Promise.resolve();

      const button = document.getElementById('privacy-btn');
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(mock).toHaveBeenCalledWith(
        expect.objectContaining({
          dialogId: 'set-privacy',
          url: '/custom/privacy/url/',
          onload: expect.objectContaining({
            set_privacy: expect.any(Function),
            set_privacy_done: expect.any(Function),
          }),
        }),
      );
    });

    it('should bind click handlers to multiple privacy buttons', async () => {
      const { mock, getOptions } = createModalWorkflowMock();
      window.ModalWorkflow = mock;

      document.body.innerHTML = `
        <button id="privacy-btn-1" data-a11y-dialog-show="set-privacy" data-url="/privacy/1/"></button>
        <button id="privacy-btn-2" data-a11y-dialog-show="set-privacy" data-url="/privacy/2/"></button>
      `;

      await jest.isolateModulesAsync(async () => {
        await import('./privacy-switch');
      });
      await Promise.resolve();

      const button1 = document.getElementById('privacy-btn-1');
      const button2 = document.getElementById('privacy-btn-2');

      button1.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(mock).toHaveBeenCalledTimes(1);
      expect(getOptions().url).toBe('/privacy/1/');

      button2.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(mock).toHaveBeenCalledTimes(2);
      expect(getOptions().url).toBe('/privacy/2/');
    });
  });

  describe('set_privacy onload handler', () => {
    it('should bind submit handler to form in modal body', async () => {
      const { mock, getOptions } = createModalWorkflowMock();
      window.ModalWorkflow = mock;

      document.body.innerHTML = `
        <button id="privacy-btn" data-a11y-dialog-show="set-privacy" data-url="/privacy/"></button>
      `;

      await jest.isolateModulesAsync(async () => {
        await import('./privacy-switch');
      });
      await Promise.resolve();

      const mockForm = document.createElement('form');
      mockForm.setAttribute('action', '/submit/privacy/');
      mockForm.innerHTML = '<input name="visibility" value="public">';
      mockForm.addEventListener = jest.fn();

      const mockModal = {
        body: {
          querySelector: jest.fn().mockReturnValue(mockForm),
        },
        postForm: mockPostForm,
      };

      const button = document.getElementById('privacy-btn');
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      // Get the set_privacy handler and call it
      const { onload } = getOptions();
      onload.set_privacy(mockModal);

      expect(mockModal.body.querySelector).toHaveBeenCalledWith('form');
      expect(mockForm.addEventListener).toHaveBeenCalledWith(
        'submit',
        expect.any(Function),
      );
    });

    it('should not throw if form is not found in modal body', async () => {
      const { mock, getOptions } = createModalWorkflowMock();
      window.ModalWorkflow = mock;

      document.body.innerHTML = `
        <button id="privacy-btn" data-a11y-dialog-show="set-privacy" data-url="/privacy/"></button>
      `;

      await jest.isolateModulesAsync(async () => {
        await import('./privacy-switch');
      });
      await Promise.resolve();

      const mockModal = {
        body: {
          querySelector: jest.fn().mockReturnValue(null),
        },
        postForm: mockPostForm,
      };

      const button = document.getElementById('privacy-btn');
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      // Get the set_privacy handler and call it - should not throw
      const { onload } = getOptions();
      expect(() => onload.set_privacy(mockModal)).not.toThrow();
    });

    it('should call postForm with serialized form data on submit', async () => {
      const { mock, getOptions } = createModalWorkflowMock();
      window.ModalWorkflow = mock;

      document.body.innerHTML = `
        <button id="privacy-btn" data-a11y-dialog-show="set-privacy" data-url="/privacy/"></button>
        <form id="test-form" action="/submit/privacy/">
          <input name="visibility" value="public">
        </form>
      `;

      await jest.isolateModulesAsync(async () => {
        await import('./privacy-switch');
      });
      await Promise.resolve();

      const testForm = document.getElementById('test-form');

      const mockModal = {
        body: {
          querySelector: jest.fn().mockReturnValue(testForm),
        },
        postForm: mockPostForm,
      };

      const button = document.getElementById('privacy-btn');
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      // Get the set_privacy handler and call it
      const { onload } = getOptions();
      onload.set_privacy(mockModal);

      // Dispatch submit event on the form
      const submitEvent = new Event('submit', { bubbles: true });
      submitEvent.preventDefault = jest.fn();
      testForm.dispatchEvent(submitEvent);

      expect(submitEvent.preventDefault).toHaveBeenCalled();
      expect(mockPostForm).toHaveBeenCalledWith(
        '/submit/privacy/',
        'visibility=public',
      );
    });
  });

  describe('set_privacy_done onload handler', () => {
    it('should dispatch w-privacy:changed event with isPublic detail', async () => {
      const { mock, getOptions } = createModalWorkflowMock();
      window.ModalWorkflow = mock;

      document.body.innerHTML = `
        <button id="privacy-btn" data-a11y-dialog-show="set-privacy" data-url="/privacy/"></button>
      `;

      await jest.isolateModulesAsync(async () => {
        await import('./privacy-switch');
      });
      await Promise.resolve();

      const mockModal = {
        close: mockClose,
      };

      const eventListener = jest.fn();
      document.addEventListener('w-privacy:changed', eventListener);

      const button = document.getElementById('privacy-btn');
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      // Get the set_privacy_done handler and call it
      const { onload } = getOptions();
      onload.set_privacy_done(mockModal, { is_public: true });

      expect(eventListener).toHaveBeenCalled();
      const event = eventListener.mock.calls[0][0];
      expect(event.detail).toEqual({ isPublic: true });

      document.removeEventListener('w-privacy:changed', eventListener);
    });

    it('should call modal.close() after dispatching event', async () => {
      const { mock, getOptions } = createModalWorkflowMock();
      window.ModalWorkflow = mock;

      document.body.innerHTML = `
        <button id="privacy-btn" data-a11y-dialog-show="set-privacy" data-url="/privacy/"></button>
      `;

      await jest.isolateModulesAsync(async () => {
        await import('./privacy-switch');
      });
      await Promise.resolve();

      const mockModal = {
        close: mockClose,
      };

      const button = document.getElementById('privacy-btn');
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      // Get the set_privacy_done handler and call it
      const { onload } = getOptions();
      onload.set_privacy_done(mockModal, { is_public: false });

      expect(mockClose).toHaveBeenCalled();
    });

    it('should handle is_public being false', async () => {
      const { mock, getOptions } = createModalWorkflowMock();
      window.ModalWorkflow = mock;

      document.body.innerHTML = `
        <button id="privacy-btn" data-a11y-dialog-show="set-privacy" data-url="/privacy/"></button>
      `;

      await jest.isolateModulesAsync(async () => {
        await import('./privacy-switch');
      });
      await Promise.resolve();

      const mockModal = {
        close: mockClose,
      };

      const eventListener = jest.fn();
      document.addEventListener('w-privacy:changed', eventListener);

      const button = document.getElementById('privacy-btn');
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      // Get the set_privacy_done handler and call it
      const { onload } = getOptions();
      onload.set_privacy_done(mockModal, { is_public: false });

      expect(eventListener).toHaveBeenCalled();
      const event = eventListener.mock.calls[0][0];
      expect(event.detail).toEqual({ isPublic: false });

      document.removeEventListener('w-privacy:changed', eventListener);
    });
  });
});
