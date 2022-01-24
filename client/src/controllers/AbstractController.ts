import { Controller } from '@hotwired/stimulus';
import type { ControllerConstructor } from '@hotwired/stimulus';

export interface AbstractControllerConstructor extends ControllerConstructor {
  isIncludedInCore?: boolean;
}

/**
 * Core abstract controller to keep any specific logic that is desired and
 * to house generic types as needed.
 */
export abstract class AbstractController extends Controller {
  static isIncludedInCore = false;
}
