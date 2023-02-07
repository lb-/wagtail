import { Application, Controller } from '@hotwired/stimulus';
import { gettext } from '../utils/gettext';

/**
 * Adds the ability for a button element to indicate that, when clicked, it
 * will be processing for a short time and cannot be clicked again.
 *
 * @example
 * <button
 *   type="submit"
 *   class="button button-longrunning"
 *   data-controller="w-loader"
 *   data-w-loader-active-class="button-longrunning-active"
 *   data-w-loader-active-value="{% trans 'Signing in…' %}"
 *   data-w-loader-duration-seconds-value="40"
 *   data-action="w-loader#activate"
 * >
 *  {% icon name="spinner" %}
 *  <em data-w-loader-target="label">{% trans 'Sign in' %}</em>
 * </button>
 */
export class LoaderController extends Controller<HTMLButtonElement> {
  static classes = ['active'];
  static targets = ['label'];
  static values = {
    loading: { type: Boolean, default: false },
    active: { type: String, default: gettext('Loading') },
    durationSeconds: { type: Number, default: 30 },
    label: { type: String, default: '' },
  };

  declare activeClass: string;
  declare activeValue: string;
  declare durationSecondsValue: number;
  declare hasActiveClass: boolean;
  declare hasLabelTarget: boolean;
  declare labelTarget: HTMLElement;
  declare labelValue: string;
  declare loadingValue: boolean;
  timer?: number;

  static afterLoad(identifier: string, application: Application) {
    const { controllerAttribute } = application.schema;
    const { actionAttribute } = application.schema;

    const updateLoader = () => {
      const em = document.querySelector('em') as HTMLElement;
      document
        .querySelectorAll(
          `.button-longrunning:not([data-controller~='${identifier}'])`,
        )
        .forEach((button) => {
          button.setAttribute(controllerAttribute, identifier);
          button.setAttribute(actionAttribute, 'w-loader#activate');

          if (button.getAttribute('data-clicked-text')) {
            button.setAttribute(
              'data-w-loader-active-value',
              `${button.getAttribute('data-clicked-text')}`,
            );
            button.removeAttribute('data-clicked-text');
          }

          if (em.matches('button em')) {
            em.setAttribute('data-w-loader-target', 'label');
          }

          button.setAttribute('data-w-loader-duration-seconds-value', '10');
        });
    };

    document.addEventListener('DOMContentLoaded', updateLoader);
  }

  activate() {
    // If client-side validation is active on this form, and is going to block submission of the
    // form, don't activate the spinner
    const form = this.element.closest('form');

    if (
      form &&
      form.checkValidity &&
      !form.noValidate &&
      !form.checkValidity()
    ) {
      return;
    }

    window.setTimeout(() => {
      if (this.activeValue && this.hasLabelTarget === true) {
        this.labelTarget.textContent = this.activeValue;
      }

      this.loadingValue = true;

      const durationMs = this.durationSecondsValue * 1000;

      this.timer = window.setTimeout(() => {
        this.loadingValue = false;
      }, durationMs);
    });
  }

  loadingValueChanged(isLoading: boolean) {
    this.labelValue =
      this.labelValue || this.hasLabelTarget
        ? (this.labelTarget.textContent as string)
        : (this.element.textContent as string);

    const activeClass = this.hasActiveClass
      ? this.activeClass
      : 'button-longrunning-active';

    this.element.classList.toggle(activeClass, isLoading);

    if (isLoading) {
      // Disabling button must be done last: disabled buttons can't be
      // modified in the normal way, it would seem.
      this.element.setAttribute('disabled', '');
    } else {
      this.element.removeAttribute('disabled');

      if (this.activeValue && this.hasLabelTarget) {
        this.labelTarget.textContent = this.labelValue;
      }
    }
  }

  disconnect(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }
}
