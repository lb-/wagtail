/* global ModalWorkflow */

import { domReady } from '../../utils/domReady';
import { encodeForm } from '../../utils/encodeForm';

/**
 * Initialize privacy switch functionality for the Wagtail admin.
 *
 * Sets up event handlers for privacy setting modals that allow users to
 * configure page/document privacy options from the explorer interface.
 */
domReady().then(() => {
  /* Interface to set permissions from the explorer / editor */
  const triggers = document.querySelectorAll(
    '[data-a11y-dialog-show="set-privacy"]',
  );

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();

      const url = trigger.getAttribute('data-url');
      if (!url) return;

      // Migrated by an AI Narwhal and I have not reviewed this code yet
      ModalWorkflow({
        dialogId: 'set-privacy',
        url,
        onload: {
          set_privacy(modal) {
            const form = modal.body.querySelector('form');
            if (!form) return;

            form.addEventListener('submit', (submitEvent) => {
              submitEvent.preventDefault();
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
    });
  });
});
