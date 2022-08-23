import { Controller } from '@hotwired/stimulus';

/**
 * Auto-submits forms when the fields change.
 *
 * @example
 * // once any change is made to the below select field, the form will be auto submitted
 * <form>
 *   <select name="order" data-controller="w-auto-field" data-action="change->w-auto-field#submit">
 *     <option value="A-Z">A to Z</option>
 *     <option value="Z-A">Z to A</option>
 *   </select>
 * </form>
 */
export class AutoFieldController extends Controller<
  HTMLInputElement | HTMLSelectElement
> {
  submit() {
    if (!this.element.form) {
      throw new Error(
        `${this.identifier} controlled element must be part of a <form />`,
      );
    }
    this.element.form.submit();
  }
}
