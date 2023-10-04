import { Controller } from '@hotwired/stimulus';
import { ngettext } from '../utils/gettext';

const DEFAULT_ERROR_SELECTOR = '.error-message,.help-critical';

/**
 * Adds the ability for a controlled element to update the total count
 * of selected elements within the provided container selector, defaults
 * to `body`.
 *
 * @example - Basic usage
 * <div data-controller="w-count">
 *  <span data-w-count-target="label"></span>
 *  <span class="error-message">An error</span>
 * </div>
 *
 * @example - Use custom translated values passed into the HTML
 * <div data-controller="w-count" data-w-count-labels-value='["One item","Many items"]>
 *  <span data-w-count-target="label"><!--Will be replaced with 'One item' --></span>
 *  <span class="error-message">An error</span>
 * </div>
 * <div data-controller="w-count" data-w-count-labels-value='["One item","Many items"]>
 *  <span data-w-count-target="label"><!--Will be replaced with 'Many items' --></span>
 *  <span class="error-message">An error</span>
 *  <span class="error-message">An error</span>
 * </div>
 *
 * @example - Using a custom selector for counts
 * <section id="count-section">
 *   <div
 *      data-controller="w-count"
 *      data-w-count-container-value="#count-section"
 *      data-w-count-find=".item:not(:empty)"
 *    >
 *    <span data-w-count-target="label"></span>
 *   </div>
 *   <ul>
 *     <li class="item">Count me</li>
 *     <li class="item">Count me also</li>
 *     <li class="item"></li> <!-- NOT COUNTED -->
 *   </ul>
 * </section>
 *
 * @example - Updating classes based on counts
 * <section id="count-section">
 *   <div
 *      class="remove-when-first-counted"
 *      data-controller="w-count"
 *      data-w-count-container-value="#count-section"
 *      data-w-count-active-container-class="add-to-controlled-div-when-above-min"
 *      data-w-count-active-container-class="add-to-section-when-above-min"
 *      data-w-count-initial-class="remove-when-first-counted"
 *    >
 *    <span data-w-count-target="label"></span>
 *    <span class="error-message">An error</span>
 *   </div>
 * </section>
 */
export class CountController extends Controller<HTMLFormElement> {
  static classes = ['active', 'activeContainer', 'initial'];

  static targets = ['label', 'total'];

  static values = {
    container: { default: 'body', type: String },
    find: { default: DEFAULT_ERROR_SELECTOR, type: String },
    labels: { default: [], type: Array },
    min: { default: 0, type: Number },
    total: { default: 0, type: Number },
  };

  /** Selector string, used to determine the container/s to search through. */
  declare containerValue: string;
  /** Selector string, used to find the elements to count within the container. */
  declare findValue: string;
  /** Override pluralisation strings. */
  declare labelsValue: string[];
  /** Minimum value, anything equal or below will trigger blank labels in the UI. */
  declare minValue: number;
  /** Total current count of found elements. */
  declare totalValue: number;

  /** Classes to set on the controlled element when count is above zero. */
  declare readonly activeClasses: string[];
  /** Classes to set on the container when count is above zero. */
  declare readonly activeContainerClasses: string[];
  /** Classes to remove on the controlled element when the controller has set the (initial) count. */
  declare readonly initialClasses: string[];

  declare readonly hasLabelTarget: boolean;
  declare readonly hasTotalTarget: boolean;
  declare readonly labelTarget: HTMLElement;
  declare readonly totalTarget: HTMLElement;

  connect() {
    this.count();
  }

  count() {
    const totalValue = this.containerTargets
      .map((element) => element.querySelectorAll(this.findValue).length)
      .reduce((total, subTotal) => total + subTotal, 0);
    this.totalValue = totalValue;
    return totalValue;
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

  totalValueChanged(total: number, previousTotal?: number) {
    if (total === previousTotal) return;

    const min = this.minValue;
    const isActive = total > min;

    // Update content
    if (this.hasLabelTarget) {
      this.labelTarget.textContent = isActive ? this.getLabel(total) : '';
    }
    if (this.hasTotalTarget) {
      this.totalTarget.textContent = isActive ? `${total}` : '';
    }

    // Update classes
    this.activeClasses.forEach((activeClass) => {
      this.element.classList.toggle(activeClass, isActive);
    });

    this.containerTargets.forEach((container) => {
      this.activeContainerClasses.forEach((activeClass) => {
        container.classList.toggle(activeClass, isActive);
      });
    });

    this.element.classList.remove(...this.initialClasses);
  }

  get containerTargets() {
    return Array.from(document.querySelectorAll(this.containerValue || 'body'));
  }
}
