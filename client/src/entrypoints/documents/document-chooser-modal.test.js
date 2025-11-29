import './document-chooser-modal';

// Since document-chooser-modal extends ChooserModalOnloadHandlerFactory, we import the module to
// ensure the subclass is registered, then instantiate via factory for the 'documents' type.
// No side-effect import needed now that we import the class directly

describe('Document chooser modal click handling', () => {
  it('sets upload collection value when clicking upload-one-now', () => {
    const modalBody = document.createElement('div');
    const context = modalBody;

    const collectionInput = document.createElement('input');
    collectionInput.id = 'id_collection_id';
    collectionInput.value = '42';

    const uploadTarget = document.createElement('input');
    uploadTarget.id = 'id_document-chooser-upload-collection';

    const link = document.createElement('a');
    link.className = 'upload-one-now';
    link.href = '#';

    // Minimal search UI required by choose handler
    const searchForm = document.createElement('form');
    searchForm.setAttribute('data-chooser-modal-search', '');
    searchForm.setAttribute('action', '/search');
    const searchInput = document.createElement('input');
    searchInput.id = 'id_q';
    searchForm.appendChild(searchInput);
    const resultsContainer = document.createElement('div');
    resultsContainer.id = 'search-results';

    modalBody.appendChild(collectionInput);
    modalBody.appendChild(uploadTarget);
    modalBody.appendChild(searchForm);
    modalBody.appendChild(resultsContainer);
    context.appendChild(link);

    const modal = { body: modalBody, ajaxifyForm: () => {} };

    // Use the window global created on import to run choose step
    window.DOCUMENT_CHOOSER_MODAL_ONLOAD_HANDLERS.choose(modal, {});

    link.click();

    expect(uploadTarget.value).toBe('42');
  });

  it('falls back to document when elements are not in modal body', () => {
    const modalBody = document.createElement('div');
    const context = modalBody;

    const collectionInput = document.createElement('input');
    collectionInput.id = 'id_collection_id';
    collectionInput.value = '77';

    const uploadTarget = document.createElement('input');
    uploadTarget.id = 'id_document-chooser-upload-collection';

    const link = document.createElement('a');
    link.className = 'upload-one-now';
    link.href = '#';

    // Minimal search UI required by choose handler
    const searchForm = document.createElement('form');
    searchForm.setAttribute('data-chooser-modal-search', '');
    searchForm.setAttribute('action', '/search');
    const searchInput = document.createElement('input');
    searchInput.id = 'id_q';
    searchForm.appendChild(searchInput);
    const resultsContainer = document.createElement('div');
    resultsContainer.id = 'search-results';

    // Attach inputs to document to validate fallback behavior
    document.body.appendChild(collectionInput);
    document.body.appendChild(uploadTarget);
    modalBody.appendChild(searchForm);
    modalBody.appendChild(resultsContainer);
    context.appendChild(link);

    const modal = { body: modalBody, ajaxifyForm: () => {} };

    window.DOCUMENT_CHOOSER_MODAL_ONLOAD_HANDLERS.choose(modal, {});

    link.click();

    expect(uploadTarget.value).toBe('77');

    // Cleanup
    document.body.removeChild(collectionInput);
    document.body.removeChild(uploadTarget);
  });
});
