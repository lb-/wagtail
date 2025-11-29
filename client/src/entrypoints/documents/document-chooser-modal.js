import {
  ChooserModalOnloadHandlerFactory,
  ChooserModal,
} from '../../includes/chooserModal';

class DocumentChooserModalOnloadHandlerFactory extends ChooserModalOnloadHandlerFactory {
  ajaxifyLinks(modal, context) {
    super.ajaxifyLinks(modal, context);

    const links = context.querySelectorAll('a.upload-one-now');
    links.forEach((link) => {
      link.addEventListener('click', (event) => {
        // Set current collection ID at upload form tab
        const collectionInput =
          modal.body.querySelector('#id_collection_id') ||
          document.getElementById('id_collection_id');
        const uploadTarget =
          modal.body.querySelector('#id_document-chooser-upload-collection') ||
          document.getElementById('id_document-chooser-upload-collection');
        const collectionId =
          collectionInput && 'value' in collectionInput
            ? collectionInput.value
            : '';
        if (collectionId && uploadTarget) {
          uploadTarget.value = collectionId;
        }

        event.preventDefault();
      });
    });
  }
}

window.DOCUMENT_CHOOSER_MODAL_ONLOAD_HANDLERS =
  new DocumentChooserModalOnloadHandlerFactory({
    searchInputDelay: 50,
    creationFormTabSelector: '#tab-upload',
  }).getOnLoadHandlers();

class DocumentChooserModal extends ChooserModal {
  onloadHandlers = window.DOCUMENT_CHOOSER_MODAL_ONLOAD_HANDLERS;
}
window.DocumentChooserModal = DocumentChooserModal;
