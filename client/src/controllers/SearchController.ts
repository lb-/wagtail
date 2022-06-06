import { debounce } from '../utils/debounce';
import { initTooltips } from '../includes/initTooltips';
import { AbstractController } from './AbstractController';

/**
 * Search behaviour with async results being injected in a separate target container.
 *
 * @example
 * <form
 *   action="/index.html"
 *   method="get"
 *   role="search"
 *   data-controller="w-search"
 *   data-w-search-animate-in-class="w-animate-fade-in"
 *   data-w-search-processing-class="w-animate-pulse"
 *   data-w-search-results-selector-value="#results"
 *  >
 *    <input
 *      type="text"
 *      name="q"
 *      data-w-search-target="termInput"
 *      data-action="keyup->w-search#search cut->w-search#search paste->w-search#search change->w-search#search"
 *      id="id_q">
 *  </form>
 */
export class SearchController extends AbstractController {
  static classes = ['animateIn', 'processing'];
  static isIncludedInCore = true;
  static targets = ['termInput'];
  static values = {
    resultsSelector: { default: '#results', type: String },
    resultsUrl: { default: '', type: String },
    wait: { default: 200, type: Number },
  };

  animateInClasses: string[];
  processingClasses: string[];
  resultsContainer: HTMLElement;
  resultsSelectorValue: string;
  resultsUrlValue: string;
  search: { (...args: any[]): void; cancel(): void };
  searchCurrentIndex: number;
  searchNextIndex: number;
  termInputTarget: HTMLInputElement;
  waitValue: number;

  connect() {
    this.searchCurrentIndex = 0;
    this.searchNextIndex = 0;
    this.fetchResults = this.fetchResults.bind(this);
    this.resultsContainer = document.querySelector(
      this.resultsSelectorValue,
    ) as HTMLElement;
    this.search = debounce(this.fetchResults, this.waitValue);
  }

  disconnect() {
    this.search?.cancel();
  }

  fetchResults() {
    const urlParams = new URLSearchParams(window.location.search);
    const { termInputTarget } = this;
    const paramKey = termInputTarget.name;
    const currentQuery = urlParams.get(paramKey) || '';
    const newQuery = termInputTarget.value || '';

    // if search is the same - do nothing
    if (currentQuery.trim() === newQuery.trim()) return;

    const searchUrl =
      this.resultsUrlValue || (this.element as HTMLFormElement).action;

    // cache a current index so we can ensure that late responses do not overtake results
    this.searchNextIndex += 1;
    const index = this.searchNextIndex;

    this.toggleProcessing(true);
    this.resultsContainer.classList.remove(...this.animateInClasses);

    fetch(`${searchUrl}?${paramKey}=${newQuery}`, {
      headers: { 'x-requested-with': 'XMLHttpRequest' },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
      })
      .then((results) => {
        if (index > this.searchCurrentIndex) {
          this.searchCurrentIndex = index;
          this.insertResults(results, newQuery);
        }
      })
      .catch((error) => {
        this.dispatch('error', { cancelable: false, detail: { error } });

        throw error;
      })
      .finally(() => {
        this.toggleProcessing();
      });
  }

  /**
   * Insert HTML results and dispatch success event.
   */
  insertResults(results: string, newQuery: string) {
    /**
     * Allow for injection of results to be cancellable and resumed.
     * This provides a way to bypass animations or control when the content
     * gets injected.
     *
     */
    const resume = (overrides: { results?: string } = {}) => {
      this.resultsContainer.innerHTML = overrides.results || results;
      initTooltips();

      this.dispatchAnimate(this.animateInClasses, {
        target: this.resultsContainer,
      }).finally(() => {
        window.history.replaceState(null, '', newQuery ? `?q=${newQuery}` : '');
      });
    };

    this.dispatchResume('success', {
      detail: { resume, results, resultsContainer: this.resultsContainer },
    });
  }

  toggleProcessing(isProcessing = false) {
    const { termInputTarget } = this;
    const inputContainer = termInputTarget.closest('.input') || termInputTarget;

    if (inputContainer) {
      if (isProcessing) {
        inputContainer.classList.add(...this.processingClasses);
      } else {
        inputContainer.classList.remove(...this.processingClasses);
      }
    }
  }
}
