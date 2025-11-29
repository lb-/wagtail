/* global ModalWorkflow */

import { domReady } from '../../utils/domReady';
import { encodeForm } from '../../utils/encodeForm';

/**
 * Initialize privacy modal triggers.
 *
 * Binds click handlers to elements with `data-a11y-dialog-show="set-privacy"` to
 * open a ModalWorkflow and handle form submissions.
 */
domReady().then(() => {
  const initModalWorkflow = (url) => {
    ModalWorkflow({
      dialogId: 'set-privacy',
      url: url,
      onload: {
        set_privacy(modal) {
          const form = modal.body.querySelector('form');
          if (!form) return;
          form.addEventListener('submit', (formSubmitEvent) => {
            formSubmitEvent.preventDefault();
            const action = form.getAttribute('action') || form.action;
            modal.postForm(action, encodeForm(form));
          });
        },
        set_privacy_done(modal, { is_public: isPublic }) {
          document.dispatchEvent(
            new CustomEvent('w-privacy:changed', {
              bubbles: true,
              cancelable: false,
              detail: { isPublic },
            }),
          );
          modal.close();
        },
      },
    });
  };

  document
    .querySelectorAll('[data-a11y-dialog-show="set-privacy"]')
    .forEach((trigger) => {
      trigger.addEventListener(
        'click',
        (event) => {
          event.preventDefault();
          initModalWorkflow(trigger.getAttribute('data-url') || '');
        },
        { passive: false },
      );
    });
});
