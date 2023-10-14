import { Controller } from '@hotwired/stimulus';

const castArray = (...args) => args.flat(1);

/**
 *
 */
export class CondController extends Controller<HTMLFormElement> {
  static targets = ['disable', 'enable', 'hide', 'show'];

  declare disableTargets: HTMLElement[];
  declare enableTargets: HTMLElement[];
  declare hideTargets: HTMLElement[];
  declare showTargets: HTMLElement[];

  connect() {
    // TODO - debounce resolve
  }

  resolve() {
    const form = this.element;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    this.enableTargets.forEach((target) => {
      const matchStr = target.getAttribute('data-match');
      let match = {};

      if (matchStr) {
        try {
          match = JSON.parse(matchStr);
          if (Array.isArray(match)) match = Object.fromEntries(match);
        } catch (e) {
          //
        }
      }

      if (
        match &&
        Object.entries(match).every(([key, value]) =>
          castArray(value)
            .map(String)
            .includes(String(data[key] || '')),
        )
      ) {
        target.removeAttribute('disabled');
      } else {
        target.setAttribute('disabled', 'disabled');
        if (target instanceof HTMLOptionElement) {
          const selectElement = target.closest('select');
          if (selectElement && target.selected) {
            selectElement.value =
              Array.from(selectElement.options).find(
                (option) => option.defaultSelected,
              )?.value || '';
            this.dispatch('change', {
              target: selectElement,
              bubbles: true,
              cancelable: false,
            });
          }
        }
      }
    });

    this.disableTargets.forEach((target) => {
      const matchStr = target.getAttribute('data-match');
      let match = {};

      if (matchStr) {
        try {
          match = JSON.parse(matchStr);
          if (Array.isArray(match)) match = Object.fromEntries(match);
        } catch (e) {
          //
        }
      }

      if (
        match &&
        Object.entries(match).every(([key, value]) =>
          castArray(value)
            .map(String)
            .includes(String(data[key] || '')),
        )
      ) {
        target.setAttribute('disabled', 'disabled');
        if (target instanceof HTMLOptionElement) {
          const selectElement = target.closest('select');
          if (selectElement && target.selected) {
            selectElement.value =
              Array.from(selectElement.options).find(
                (option) => option.defaultSelected,
              )?.value || '';
            this.dispatch('change', {
              target: selectElement,
              bubbles: true,
              cancelable: false,
            });
          }
        }
      } else {
        target.removeAttribute('disabled');
      }
    });

    this.hideTargets.forEach((target) => {
      const matchStr = target.getAttribute('data-match');
      let match = {};

      if (matchStr) {
        try {
          match = JSON.parse(matchStr);
          if (Array.isArray(match)) match = Object.fromEntries(match);
        } catch (e) {
          //
        }
      }

      if (
        match &&
        Object.entries(match).every(([key, value]) =>
          castArray(value)
            .map(String)
            .includes(String(data[key] || '')),
        )
      ) {
        // eslint-disable-next-line no-param-reassign
        target.hidden = true;
        if (target instanceof HTMLOptionElement) {
          const selectElement = target.closest('select');
          if (selectElement && target.selected) {
            selectElement.value =
              Array.from(selectElement.options).find(
                (option) => option.defaultSelected,
              )?.value || '';
            this.dispatch('change', {
              target: selectElement,
              bubbles: true,
              cancelable: false,
            });
          }
        }
      } else {
        // eslint-disable-next-line no-param-reassign
        target.hidden = false;
      }
    });

    this.showTargets.forEach((target) => {
      const matchStr = target.getAttribute('data-match');
      let match = {};

      if (matchStr) {
        try {
          match = JSON.parse(matchStr);
          if (Array.isArray(match)) match = Object.fromEntries(match);
        } catch (e) {
          //
        }
      }

      if (
        match &&
        Object.entries(match).every(([key, value]) =>
          castArray(value)
            .map(String)
            .includes(String(data[key] || '')),
        )
      ) {
        // eslint-disable-next-line no-param-reassign
        target.hidden = false;
      } else {
        // eslint-disable-next-line no-param-reassign
        target.hidden = true;
        if (target instanceof HTMLOptionElement) {
          const selectElement = target.closest('select');
          if (selectElement && target.selected) {
            selectElement.value =
              Array.from(selectElement.options).find(
                (option) => option.defaultSelected,
              )?.value || '';
            this.dispatch('change', {
              target: selectElement,
              bubbles: true,
              cancelable: false,
            });
          }
        }
      }
    });
  }

  enableTargetConnected() {
    this.resolve();
  }

  disableTargetConnected() {
    this.resolve();
  }

  hideTargetConnected() {
    this.resolve();
  }

  showTargetConnected() {
    this.resolve();
  }
}
