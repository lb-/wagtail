import { Controller } from '@hotwired/stimulus';
import { WAGTAIL_CONFIG } from '../config/wagtailConfig';
import { slugify } from '../utils/slugify';
import { urlify } from '../utils/urlify';

type ValidMethods = 'slugify' | 'urlify';

/**
 * Adds ability to clean values of an input element with methods such as slugify or urlify.
 *
 * @example - using the slugify method
 * <input type="text" name="slug" data-controller="w-clean" data-action="blur->w-clean#slugify" />
 *
 * @example - using the urlify method (registered as w-slug)
 * <input type="text" name="url-path" data-controller="w-slug" data-action="change->w-slug#urlify" />
 */
export class CleanController extends Controller<HTMLInputElement> {
  static values = {
    allowUnicode: { default: false, type: Boolean },
    locale: { default: '', type: String },
    replace: { default: [], type: Array },
    replaceFlags: { default: 'ig', type: String },
  };

  /** If true, unicode values in the cleaned values will be allowed */
  declare allowUnicodeValue: boolean;
  /** Locale code, used to provide a more specific cleaned value. */
  declare localeValue: string;
  /** An array of entries (pairs), where the first item is a RegEx pattern & the second is a character to replace. */
  declare replaceValue: [string, string?][];
  /** @todo make this a subset of characters (TypeScript), add description also. */
  declare replaceFlagsValue: string;

  /**
   * If the locale is not provided, it will default to the active content locale.
   */
  connect() {
    if (!this.localeValue) {
      // Note: It would be nicer if we could avoid relying on globals like this
      // Best to investigate if there's a simple way to pass this to the widget via the edit/create forms
      this.localeValue = WAGTAIL_CONFIG.ACTIVE_CONTENT_LOCALE;
    }
  }

  /**
   * Allow for a comparison value to be provided so that a dispatched event can be
   * prevented. This provides a way for other events to interact with this controller
   * to block further updates if a value is not in sync.
   * By default it will compare to the slugify method, this can be overridden by providing
   * either a Stimulus param value on the element or the event's detail.
   */
  compare(
    event: CustomEvent<{ compareAs?: ValidMethods; value: string }> & {
      params?: { compareAs?: ValidMethods };
    },
  ) {
    // do not attempt to compare if the current field is empty
    if (!this.element.value) {
      return true;
    }

    const compareAs =
      event.detail?.compareAs || event.params?.compareAs || 'slugify';

    const compareValue = this[compareAs](
      { detail: { value: event.detail?.value || '' } },
      true,
    );

    const currentValue = this.element.value;

    const valuesAreSame = compareValue.trim() === currentValue.trim();

    if (!valuesAreSame) {
      event?.preventDefault();
    }

    return valuesAreSame;
  }

  /**
   * Replaces matched characters found in the supplied value.
   */
  replace(
    event: CustomEvent<{ value: string }> | { detail: { value: string } },
    ignoreUpdate = false,
  ) {
    const { value = this.element.value } = event?.detail || {};

    /** @todo - abstract this RegEx generation to a instance method or similar, avoid running this code multiple times */

    const flags = this.replaceFlagsValue.trim().toLowerCase();
    const isGlobal = flags.includes('g');

    const newValue = this.replaceValue.reduce(
      (str, [pattern, replaceWith = '']) =>
        isGlobal
          ? str.replaceAll(RegExp(pattern, flags), replaceWith)
          : str.replace(RegExp(pattern, flags), replaceWith),
      value,
    );

    if (!ignoreUpdate) {
      this.element.value = newValue;
      // Note: Adding this to support additional event actions, especially as we cannot dispatch 'change'
      this.dispatch('replace', {
        cancelable: false,
        detail: { value, newValue },
      });
    }

    return newValue;
  }

  replaceValueChanged() {
    // todo - move the prep/validation of the `replaceValue` here into a cache/function that sits on the instance
    // better for performance and flags issues on connect
  }

  /**
   * Basic slugify of a string, updates the controlled element's value
   * or can be used to simply return the transformed value.
   * If a custom event with detail.value is provided, that value will be used
   * instead of the field's value.
   */
  slugify(
    event: CustomEvent<{ value: string }> | { detail: { value: string } },
    ignoreUpdate = false,
  ) {
    const allowUnicode = this.allowUnicodeValue;
    const { value = this.element.value } = event?.detail || {};
    const newValue = slugify(value.trim(), { allowUnicode });

    if (!ignoreUpdate) {
      this.element.value = newValue;
      // Note: Adding this to support additional event actions, especially as we cannot dispatch 'change'
      this.dispatch('slugify', {
        cancelable: false,
        detail: { value, newValue },
      });
    }

    return newValue;
  }

  /**
   * Advanced slugify of a string, updates the controlled element's value
   * or can be used to simply return the transformed value.
   *
   * The urlify (Django port) function performs extra processing on the string &
   * is more suitable for creating a slug from the title, rather than sanitizing manually.
   * If the urlify util returns an empty string it will fall back to the slugify method.
   *
   * If a custom event with detail.value is provided, that value will be used
   * instead of the field's value.
   */
  urlify(
    event: CustomEvent<{ value: string }> | { detail: { value: string } },
    ignoreUpdate = false,
  ) {
    const allowUnicode = this.allowUnicodeValue;
    const { value = this.element.value } = event?.detail || {};
    const trimmedValue = value.trim();

    // first - run any replace that may be set on the controller
    let newValue = this.replace({ detail: { value: trimmedValue } }, true);

    // second - urlify the value, falling back to slugify if the urlify cannot prepare a non-empty string
    newValue =
      urlify(newValue, { allowUnicode }) ||
      this.slugify({ detail: { value: newValue } }, true);

    if (!ignoreUpdate) {
      this.element.value = newValue;
      // Note: Adding this to support additional event actions, especially as we cannot dispatch 'change'
      this.dispatch('urlify', {
        cancelable: false,
        detail: { value, newValue },
      });
    }

    return newValue;
  }
}
