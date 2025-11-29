/* global ModalWorkflow */

import { domReady } from '../../utils/domReady';
import { encodeForm } from '../../utils/encodeForm';

/**
 * Handles the click event on privacy buttons to open the privacy settings modal.
 *
 * @param {MouseEvent} event - The click event
 */
function handlePrivacyClick(event) {
  event.preventDefault();

  const button = event.currentTarget;

  ModalWorkflow({
    dialogId: 'set-privacy',
    url: button.getAttribute('data-url'),
    onload: {
      /**
       * Handles the 'set_privacy' step of the modal workflow.
       * Sets up form submission handling within the modal.
       *
       * @param {object} modal - The modal workflow instance
       */
      set_privacy(modal) {
        const form = modal.body.querySelector('form');
        if (!form) return;

        form.addEventListener('submit', (submitEvent) => {
          submitEvent.preventDefault();
          modal.postForm(form.getAttribute('action'), encodeForm(form));
        });
      },
      /**
       * Handles the 'set_privacy_done' step of the modal workflow.
       * Dispatches a custom event and closes the modal.
       *
       * @param {object} modal - The modal workflow instance
       * @param {object} response - The response from the server
       * @param {boolean} response.is_public - Whether the page is public
       */
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
}

/**
 * Initializes privacy switch functionality.
 * Binds click handlers to all privacy buttons.
 */
function initPrivacySwitch() {
  const privacyButtons = document.querySelectorAll(
    '[data-a11y-dialog-show="set-privacy"]',
  );

  privacyButtons.forEach((button) => {
    button.addEventListener('click', handlePrivacyClick);
  });
}

domReady().then(() => {
  initPrivacySwitch();
});
