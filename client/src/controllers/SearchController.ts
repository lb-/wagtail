import { Controller } from '@hotwired/stimulus';
import { debounce } from '../utils/debounce';

declare global {
  interface Window {
    headerSearch?: { targetOutput: string; url: string };
  }
}

/**
 * Allow for an element to trigger an async query that will
 * path the results into a results DOM container. The query
 * input can be the controlled element or the containing form.
 */
export class SearchController extends Controller<
  HTMLFormElement | HTMLInputElement
> {
  static targets = ['input'];

  static values = {
    icon: { default: '', type: String },
    loading: { default: false, type: Boolean },
    src: { default: '', type: String },
    target: { default: '#results', type: String },
    wait: { default: 200, type: Number },
  };

  declare iconValue: string;
  declare loadingValue: boolean;
  declare readonly hasInputTarget: boolean;
  declare readonly hasTargetValue: boolean;
  declare readonly hasUrlValue: boolean;
  declare readonly inputTarget: HTMLInputElement;
  declare srcValue: string;
  declare targetValue: string;
  declare waitValue: number;

  /** Allow cancelling of in flight async request if disconnected */
  abortController?: AbortController;
  /** The related icon element to attach the spinner to */
  iconElement?: SVGUseElement | null;
  /** Element that receives the fetch result HTML output */
  targetElement?: HTMLElement;
  /** Debounced function to fetch results & patch into the DOM */
  update?: { (...args: any[]): void; cancel(): void };

  connect() {
    const formContainer = this.hasInputTarget
      ? this.inputTarget.form
      : this.element;

    // support legacy window global approach (add warning in the future)
    const { url: src, targetOutput } = window.headerSearch || {};
    this.targetValue = targetOutput || this.targetValue;
    this.srcValue =
      src || this.srcValue || formContainer?.getAttribute('action') || '';
    this.iconElement = null;

    const targeElement = document.querySelector(this.targetValue);

    const foundTarget = targeElement && targeElement instanceof HTMLElement;
    const hasValidUrlValue = !!this.srcValue;

    if (!foundTarget || !hasValidUrlValue) {
      throw new Error(
        [
          !hasValidUrlValue && 'Cannot find valid src URL value',
          !foundTarget &&
            `Cannot find valid target element at "${this.targetValue}"`,
        ]
          .filter(Boolean)
          .join(', '),
      );
    }

    this.targetElement = targeElement as HTMLElement;

    // set up icons
    const iconContainer = (
      this.hasInputTarget ? this.inputTarget : this.element
    ).parentElement;

    this.iconElement = iconContainer?.querySelector('use') || null;
    this.iconValue = this.iconElement?.getAttribute('href') || '';
    this.loadingValue = false;

    // set up debounced update method
    this.update = debounce(this.locationSearch.bind(this), this.waitValue);
  }

  disconnect() {
    this.loadingValue = false;
    this.update?.cancel();
  }

  loadingValueChanged(isLoading: boolean) {
    if (!this.iconElement) return;

    if (isLoading) {
      this.iconElement.setAttribute('href', '#icon-spinner');
    } else if (this.iconValue) {
      this.iconElement.setAttribute('href', this.iconValue);
    }
  }

  /**
   * Perform a search based on a single input query, and only if that query's value
   * differs from the current matching URL param. Once complete, update the URL param.
   * Additionally, clear the 'page' param in the URL if present, can be overridden
   * via action params if needed.
   */
  locationSearch({ params = {} }: { params?: { clear?: string } }) {
    const clearParams = (params?.clear || 'p').split(' ');
    const searchInput = this.hasInputTarget ? this.inputTarget : this.element;
    const queryParam = searchInput.name;
    const searchParams = new URLSearchParams(window.location.search);
    const currentQuery = searchParams.get(queryParam) || '';
    const newQuery = searchInput.value || '';

    // only do the query if it has changed for trimmed queries
    // for example - " " === "" and "first word " ==== "first word"
    if (currentQuery.trim() === newQuery.trim()) return;

    // Update search query param ('q') to the new value or remove if empty
    if (newQuery) {
      searchParams.set(queryParam, newQuery);
    } else {
      searchParams.delete(queryParam);
    }

    // clear any params (e.g. page/p) if needed
    clearParams.forEach((param) => {
      searchParams.delete(param);
    });

    const queryString = '?' + searchParams.toString();
    const url = this.srcValue;

    this.request(url + queryString).then(() => {
      window.history.replaceState(null, '', queryString);
    });
  }

  /**
   * Abort any existing requests & set up new abort controller, then fetch and patch
   * in the HTML results, dispatching an event and handling any clean up.
   * Cache the current search index so we can ensure that late responses do not
   * overtake earlier results.
   */
  async request(param: string | CustomEvent<{ url: string }>) {
    if (this.abortController) this.abortController.abort();
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    /** Parse a request URL from the supplied param, as a string or inside a custom event */
    const requestUrl =
      typeof param === 'string' ? param : param.detail.url || '';

    this.loadingValue = true;

    return fetch(requestUrl, {
      headers: { 'x-requested-with': 'XMLHttpRequest' },
      signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
      })
      .then((results) => {
        const targetElement = this.targetElement as HTMLInputElement;
        targetElement.innerHTML = results;

        this.dispatch('success', {
          cancelable: false,
          detail: { results },
          // Stimulus dispatch target element type issue https://github.com/hotwired/stimulus/issues/642
          target: targetElement,
        });
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        // eslint-disable-next-line no-console
        console.error(`Error fetching ${requestUrl}`, error);
        delete this.abortController;
      })
      .finally(() => {
        this.loadingValue = false;
      });
  }
}
