import { Controller } from '@hotwired/stimulus';
import { debounce } from '../utils/debounce';

enum ZoneMode {
  Active = 'active',
  Inactive = '',
}

/**
 * Enables the controlled element to respond to specific user interactions
 * by adding or removing CSS classes dynamically.
 *
 * @example - Shows a hover effect when files are dragged over the element.
 * ```html
 * <div
 *   data-controller="w-zone"
 *   data-w-zone-active-class="hovered active"
 *   data-action="dragover->w-zone#activate dragleave->w-zone#deactivate"
 * >
 *   Drag files here and see the effect.
 * </div>
 * ```
 *
 * @example - Switches the active state of the element based on a key value from the switch event.
 * ```html
 * <div
 *   class="super-indicator"
 *   data-controller="w-zone"
 *   data-action="w-privacy:changed@document->w-zone#switch"
 *   data-w-zone-active-class="public"
 *   data-w-zone-inactive-class="private"
 *   data-w-zone-switch-key-value="isPublic"
 * >
 *  Content
 * </div>
 * ```
 */
export class ZoneController extends Controller {
  static classes = ['active', 'inactive'];

  static values = {
    delay: { type: Number, default: 0 },
    mode: { type: String, default: ZoneMode.Inactive },
    switchKey: { type: String, default: '' },
  };

  /** Tracks the current mode for this zone. */
  declare modeValue: ZoneMode;

  /** Classes to append when the mode is active & remove when inactive. */
  declare readonly activeClasses: string[];
  /** Classes to append when the mode is inactive & remove when active. */
  declare readonly inactiveClasses: string[];
  /** Delay, in milliseconds, to use when debouncing the mode updates. */
  declare readonly delayValue: number;
  /** Key to use when switching the active state via the `switch` method. */
  declare readonly switchKeyValue: string;

  initialize() {
    const delayValue = this.delayValue;
    if (delayValue <= 0) return;
    this.activate = debounce(this.activate.bind(this), delayValue);
    // Double the delay for deactivation to prevent flickering.
    this.deactivate = debounce(this.deactivate.bind(this), delayValue * 2);
  }

  activate() {
    this.modeValue = ZoneMode.Active;
  }

  deactivate() {
    this.modeValue = ZoneMode.Inactive;
  }

  modeValueChanged(current: ZoneMode) {
    const activeClasses = this.activeClasses;
    const inactiveClasses = this.inactiveClasses;

    if (!(activeClasses.length + inactiveClasses.length)) return;

    if (current === ZoneMode.Active) {
      this.element.classList.add(...activeClasses);
      this.element.classList.remove(...inactiveClasses);
    } else {
      this.element.classList.remove(...activeClasses);
      this.element.classList.add(...inactiveClasses);
    }
  }

  /**
   * Intentionally does nothing.
   *
   * Useful for attaching data-action to leverage the built in
   * Stimulus options without needing any extra functionality.
   * e.g. preventDefault (`:prevent`) and stopPropagation (`:stop`).
   */
  noop() {}

  /**
   * Switches the active state of the zone, based ont he provided key
   * from the event detail or params.
   * If there is no key provided, it will use the fallback key of 'active'.
   *
   * If the key's value is truthy, it will set the mode to active,
   * otherwise it will set it to inactive.
   *
   * If the key is not found in the event detail or params, it will
   * do nothing.
   */
  switch(
    event?: CustomEvent<{ mode?: ZoneMode }> & {
      params?: { switchKey: string; mode: ZoneMode };
    },
  ) {
    const { switchKey = this.switchKeyValue || 'active', ...data } = {
      ...event?.detail,
      ...event?.params,
    };

    const {
      key = '',
      neg = '',
      isNegated = !!neg,
    } = (switchKey.match(/^(?<neg>!?)(?<key>.+)$/) || {}).groups || {};

    if (!key) return;
    if (!(key in data)) return;

    const match = !!data[key];
    const modeValue = match === isNegated ? ZoneMode.Inactive : ZoneMode.Active;
    this.modeValue = modeValue;
  }
}
