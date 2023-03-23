import $ from 'jquery';
import { Controller } from '@hotwired/stimulus';
import { isDateEqual } from '../utils/date';

interface JQueryDatetimepicker {
  (arg: string | object): void;
  defaults: any;
  setLocale: (arg: string) => void;
}

declare global {
  interface Window {
    wagtailConfig: {
      /* eslint-disable @typescript-eslint/naming-convention */
      STRINGS: {
        MONTHS: string[];
        WEEKDAYS: string[];
        WEEKDAYS_SHORT: string[];
      };
      /* eslint-enable */
    };
  }

  interface JQuery {
    datetimepicker: JQueryDatetimepicker;
  }

  interface JQueryStatic {
    datetimepicker: JQueryDatetimepicker;
  }
}

/**
 * Adds the ability for an input element to be used as as a date/time or datetime picker.
 *
 * @example
 * <input type="text" data-controller="w-date" data-w-date-options='{"format": "Y-m-d"}'>
 */
export class DateController extends Controller<HTMLInputElement> {
  /**
   * @see https://github.com/Microsoft/TypeScript/issues/3841#issuecomment-337560146
   */
  ['constructor']: typeof DateController;

  static defaultOptions = {
    date: {
      closeOnDateSelect: true,
      format: 'Y-m-d',
      scrollInput: false,
      timepicker: false,
    },
    datetime: {
      closeOnDateSelect: true,
      format: 'Y-m-d H:i',
      scrollInput: false,
    },
    time: {
      closeOnDateSelect: true,
      datepicker: false,
      format: 'H:i',
      scrollInput: false,
    },
  };

  static values = {
    mode: { default: 'date', type: String },
    options: { default: {}, type: Object },
  };

  /** Three modes (default configs) officially supported, defaults to 'date' if not declared */
  declare modeValue: 'date' | 'datetime' | 'time';
  /** See https://xdsoft.net/jqplugins/datetimepicker/ */
  declare optionsValue: Record<string, unknown>;

  /**
   * Set up jQuery datepicker base translations once this controller
   * is registered.
   */
  static afterLoad() {
    const {
      STRINGS: { MONTHS, WEEKDAYS, WEEKDAYS_SHORT },
    } = window.wagtailConfig;

    $.fn.datetimepicker.defaults.i18n.wagtail_custom_locale = {
      months: MONTHS,
      dayOfWeek: WEEKDAYS,
      dayOfWeekShort: WEEKDAYS_SHORT,
    };

    $.datetimepicker.setLocale('wagtail_custom_locale');
  }

  connect() {
    this.setupInitialFocus();
    $(this.element).datetimepicker(this.options);
  }

  get options() {
    const { [this.modeValue || 'date']: modeDefaultOptions = {} } =
      this.constructor.defaultOptions;

    return {
      // merging default options based on mode and global
      ...modeDefaultOptions,
      // allow provided options to override any config
      ...this.optionsValue,
      // ensure callbacks cannot be overridden
      onGenerate: this.hideCurrent,
      onChangeDateTime: () => {
        this.dispatch('change', { cancelable: false, prefix: '' });
      },
    };
  }

  /**
   * When focused programmatically (within a short time-frame), ensure that
   * the field does not receive focus. Instead blur so that the current area is kept
   * available on pressing `tab.
   * When this happens, hide the date picker so that the picker does not
   * open in an obtrusive way. Ensure the user can still use the keyboard
   * to get to the element easily.
   */
  setupInitialFocus(): void {
    const initialFocus = (event: FocusEvent) => {
      event.stopImmediatePropagation();
      const parentElement = this.element.parentElement;

      if (parentElement) {
        parentElement.setAttribute('tabindex', '-1');
        parentElement.focus();
        parentElement.addEventListener(
          'blur',
          () => {
            parentElement.removeAttribute('tabindex');
          },
          { once: true },
        );
      }

      setTimeout(() => {
        $(this.element).datetimepicker('hide');
      }, 100);
    };

    this.element.addEventListener('focus', initialFocus, { once: true });

    setTimeout(() => {
      this.element.removeEventListener('focus', initialFocus);
    }, 50);
  }

  /**
   * Remove the xdsoft_current css class from markup,
   * unless the selected date is currently in view.
   * Keep the normal behaviour if the home button is clicked.
   * Called within the context of the jQuery widget.
   */
  hideCurrent(
    this: HTMLElement[],
    current: Date,
    input: HTMLInputElement,
  ): void {
    const selected = new Date(input.value);

    if (isDateEqual(selected, current)) return;
    const [datepickerOverlay] = this;

    datepickerOverlay
      .querySelector('.xdsoft_datepicker .xdsoft_current:not(.xdsoft_today)')
      ?.classList.remove('xdsoft_current');
  }

  disconnect(): void {
    $(this.element).datetimepicker('destroy');
  }
}
