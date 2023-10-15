import { Controller } from '@hotwired/stimulus';

const castArray = (...args) => args.flat(1);

/**
 *
 */
export class CondController extends Controller<HTMLFormElement> {
  static targets = ['disable', 'enable', 'hide', 'show'];

  static value = {
    active: { default: false, type: Boolean },
  };

  /** Targets will be disabled if the `data-match` matches the scoped form data, otherwise will be enabled. */
  declare readonly disableTargets: HTMLElement[];
  /** Targets will be enabled if the `data-match` matches the scoped form data, otherwise will be disabled. */
  declare readonly enableTargets: HTMLElement[];
  /** Targets will be hidden if the `data-match` matches the scoped form data, otherwise will be shown. */
  declare readonly hideTargets: HTMLElement[];
  /** Targets will be shown if the `data-match` matches the scoped form data, otherwise will be hidden. */
  declare readonly showTargets: HTMLElement[];

  /** Allows the behavior to be stopped/started to avoid unnecessary checks. */
  declare activeValue: boolean;

  /**
   * Checks for any targets that will mean that the controller needs to be active.
   */
  checkTargets() {
    const anyTargetsExist = [
      () => this.disableTargets,
      () => this.enableTargets,
      () => this.hideTargets,
      () => this.showTargets,
    ].some((fn) => fn().length > 0);
    this.activeValue = anyTargetsExist;
  }

  resolve() {
    if (!this.activeValue) return;
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
            if (selectElement && target.selected) {
              selectElement.value =
                Array.from(selectElement.options).find(
                  (option) => option.defaultSelected,
                )?.value || '';
              // intentionally not dispatching a change event, could cause an infinite loop
              this.dispatch('cleared', {
                target: selectElement,
                bubbles: true,
              });
            }
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
            if (selectElement && target.selected) {
              selectElement.value =
                Array.from(selectElement.options).find(
                  (option) => option.defaultSelected,
                )?.value || '';
              // intentionally not dispatching a change event, could cause an infinite loop
              this.dispatch('cleared', {
                target: selectElement,
                bubbles: true,
              });
            }
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
            // intentionally not dispatching a change event, could cause an infinite loop
            this.dispatch('cleared', { target: selectElement, bubbles: true });
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
            if (selectElement && target.selected) {
              selectElement.value =
                Array.from(selectElement.options).find(
                  (option) => option.defaultSelected,
                )?.value || '';
              // intentionally not dispatching a change event, could cause an infinite loop
              this.dispatch('cleared', {
                target: selectElement,
                bubbles: true,
              });
            }
          }
        }
      }
    });

    this.dispatch('resolved', { bubbles: true, cancelable: false });
  }

  enableTargetDisconnected() {
    this.checkTargets();
  }

  enableTargetConnected() {
    this.activeValue = true;
    this.resolve();
  }

  disableTargetDisconnected() {
    this.checkTargets();
  }

  disableTargetConnected() {
    this.activeValue = true;
    this.resolve();
  }

  hideTargetDisconnected() {
    this.checkTargets();
  }

  hideTargetConnected() {
    this.activeValue = true;
    this.resolve();
  }

  showTargetDisconnected() {
    this.checkTargets();
  }

  showTargetConnected() {
    this.activeValue = true;
    this.resolve();
  }
}
