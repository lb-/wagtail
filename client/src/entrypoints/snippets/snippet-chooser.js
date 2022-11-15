import { Chooser } from '../../components/ChooserWidget';

/* global wagtailConfig */

class SnippetChooser extends Chooser {
  titleStateKey = 'string';

  getModalUrl() {
    let urlQuery = '';

    const activeContentLocale = document.head.querySelector(
      '[name="wagtail-active-content-locale"]',
    )?.content;

    if (activeContentLocale) {
      // The user is editing a piece of translated content.
      // Pass the locale along as a request parameter. If this
      // snippet is also translatable, the results will be
      // pre-filtered by this locale.
      urlQuery = '?locale=' + activeContentLocale;
    }
    return this.chooserBaseUrl + urlQuery;
  }
}
window.SnippetChooser = SnippetChooser;

function createSnippetChooser(id) {
  /* RemovedInWagtail50Warning */
  return new SnippetChooser(id);
}
window.createSnippetChooser = createSnippetChooser;
