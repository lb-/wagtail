import { Controller } from '@hotwired/stimulus';
import { ngettext } from '../utils/gettext';

const DEFAULT_ERROR_SELECTOR = '.error-message,.help-critical';

/**
 * Adds the ability for a controlled element to update the total count
 * of selected elements within the provided container selector, defaults
 * do `body.`
 *
 * @example
 * <div data-controller="w-count">
 *  <span data-w-count-target="label"></span>
 *  <span class="error-message">An error</span>
 * </div>
 */
export class CountController extends Controller<HTMLElement> {
  static classes = ['active'];
  static targets = ['label', 'total'];
  static values = {
    container: { default: 'body', type: String },
    find: { default: DEFAULT_ERROR_SELECTOR, type: String },
    labels: { default: [], type: Array },
    min: { default: 0, type: Number },
    total: { default: 0, type: Number },
  };

  /** selector string, used to determine the container/s to search through, if empty, the controller element will be used. */
  declare containerValue: string;
  /** selector string, used to find the elements to count within the container */
  declare findValue: string;
  /** override pluralisation strings, e.g. `data-w-count-labels-value='["One item","Many items"]'` */
  declare labelsValue: string[];
  /** minimum value, anything equal or below will trigger blank labels in the UI */
  declare minValue: number;
  /** total current count of found elements */
  declare totalValue: number;

  declare readonly activeClass: string;
  declare readonly hasActiveClass: boolean;
  declare readonly hasLabelTarget: boolean;
  declare readonly hasTotalTarget: boolean;
  declare readonly labelTarget: HTMLElement;
  declare readonly totalTarget: HTMLElement;

  connect() {
    this.count();
  }

  count() {
    const container = this.containerValue;

    const elementsToSearch = container
      ? [...document.querySelectorAll(container)]
      : [this.element];

    this.totalValue = elementsToSearch
      .map((element) => element.querySelectorAll(this.findValue).length)
      .reduce((total, subTotal) => total + subTotal, 0);

    return this.totalValue;
  }

  getLabel(total: number) {
    const defaultText = ngettext('%(num)s error', '%(num)s errors', total);

    if (this.labelsValue.length > 1) {
      const [single, plural = this.labelsValue[1], key = '__total__'] =
        this.labelsValue;
      return ngettext(single, plural, total).replace(key, `${total}`);
    }

    return defaultText.replace('%(num)s', `${total}`);
  }

  minValueChanged() {
    this.totalValueChanged(this.count());
  }

  totalValueChanged(total: number, previousTotal?: number | undefined) {
    const min = this.minValue;
    const isAboveMinimum = total > min;

    if (this.hasActiveClass) {
      this.element.classList.toggle(this.activeClass, isAboveMinimum);
    }
    if (this.hasLabelTarget) {
      this.labelTarget.textContent = isAboveMinimum ? this.getLabel(total) : '';
    }
    if (this.hasTotalTarget) {
      this.totalTarget.textContent = isAboveMinimum ? `${total}` : '';
    }

    if (isAboveMinimum && previousTotal !== undefined) {
      this.dispatch('above', { cancelable: false, detail: { min, total } });
    } else {
      this.dispatch('below', { cancelable: false, detail: { min, total } });
    }
  }
}
