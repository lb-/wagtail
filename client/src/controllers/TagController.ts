import Tagify from '@yaireo/tagify';

import { Controller } from '@hotwired/stimulus';
import { debounce } from '../utils/debounce';

/**
 * Settings for Tagify.
 *
 * @see https://github.com/yairEO/tagify
 */
type TagifySettings = {
  /** @see https://github.com/yairEO/tagify/?tab=readme-ov-file#persisted-data */
  id?: string;
  // TODO .. add more settings
};

/**
 * Attach the Tagify UI to the controlled element.
 *
 * See https://github.com/yairEO/tagify
 *
 * @example
 * <input id="id_tags" type="text" name="tags" data-controller="w-tag" data-w-tag-url-value="/admin/tag-autocomplete/" />
 *
 * @example - with delay
 * <input id="id_tags" type="text" name="tags" data-controller="w-tag" data-w-tag-delay-value="300" data-w-tag-url-value="/admin/tag-autocomplete/" />
 */
export class TagController extends Controller<HTMLInputElement> {
  static values = {
    delay: { type: Number, default: 0 },
    options: { default: {}, type: Object },
    url: { default: '', type: String },
  };

  /** Settings for Tagify, see https://github.com/yairEO/tagify */
  declare optionsValue: TagifySettings;
  /** URL for async tag autocomplete. */
  declare urlValue: string;
  /** Delay to use when debouncing the async tag autocomplete. */
  declare delayValue: number;

  private autocompleteAbort: AbortController | null = null;
  private autocompleteLazy;

  tagify: Tagify;

  initialize() {
    this.autocompleteLazy = debounce(
      this.autocomplete.bind(this),
      this.delayValue,
    );
  }

  connect() {
    const initialTags = (this.element.value || '')
      .trim()
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    this.element.value = initialTags.join(',');

    this.tagify = new Tagify(this.element, {
      ...this.optionsValue,
      whitelist: initialTags,
      transformTag: (data) => {
        // eslint-disable-next-line no-param-reassign
        data.value = this.cleanTag(data.value);
      },
      /**
       * Convert the array of objects to a string of comma-separated values.
       * @see https://github.com/yairEO/tagify?tab=readme-ov-file#modify-original-input-value-format
       */
      originalInputValueFormat: (values: { value: string }[]) =>
        values.map(({ value }) => (value || '').trim()).join(','),
    });

    this.tagify.on('input', ({ detail }) => {
      this.autocompleteLazy.cancel();
      this.tagify.loading(true);
      this.autocompleteLazy(detail)
        .then((whitelist) => {
          this.tagify.whitelist = whitelist;
          this.tagify.loading(false).dropdown.show(detail.value);
        })
        .finally(() => {
          this.tagify.loading(false);
        });
    });
  }

  async autocomplete({ value: term }: { value: string }) {
    if (this.autocompleteAbort) {
      this.autocompleteAbort.abort();
    }

    this.autocompleteAbort = new AbortController();
    const { signal } = this.autocompleteAbort;

    try {
      const url = new URL(this.urlValue, window.location.origin);
      url.searchParams.set('term', term);

      const fetchResponse = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        method: 'GET',
        signal,
      });

      const data = await fetchResponse.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        this.context.application.handleError(
          error,
          'Network or API error during autocomplete request.',
          { term, url: this.urlValue },
        );
      }
    } finally {
      this.autocompleteAbort = null;
    }

    return [];
  }

  /**
   * Double quote a tag if it contains a space
   * and if it isn't already quoted.
   */
  cleanTag(value: string) {
    return value && value[0] !== '"' && value.indexOf(' ') > -1
      ? `"${value}"`
      : value;
  }

  /**
   * Method to clear all the tags that are set.
   */
  clear() {
    this.tagify?.removeAllTags();
  }

  disconnect() {
    if (this.autocompleteAbort) {
      this.autocompleteAbort.abort();
      this.autocompleteAbort = null;
    }
  }
}
