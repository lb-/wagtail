import type { Definition } from '@hotwired/stimulus';
import { Application, Controller } from '@hotwired/stimulus';

type ControllerObjectDefinition = Record<string, () => void> & {
  STATIC?: {
    classes?: string[];
    targets?: string[];
    values: typeof Controller.values;
  };
};

/**
 * Extend the Stimulus application class to provide some convenience
 * static attributes or methods to be accessed globally.
 */
class WagtailApplication extends Application {
  /**
   * Ensure the base Controller class is available for new controllers.
   */
  static Controller = Controller;

  /**
   * Function that accepts a plain old object and returns a Stimulus Controller.
   * Useful when ES6 modules with base class being extended not in use
   * or build tool not in use or for just super convenient class creation.
   *
   * Inspired heavily by
   * https://github.com/StackExchange/Stacks/blob/v1.6.5/lib/ts/stacks.ts#L84
   *
   * @example
   * createController({
   *   STATIC: { targets = ['container'] }
   *   connect() {
   *     console.log('connected', this.element, this.containerTarget);
   *   }
   * })
   *
   */
  static createController = (
    controllerDefinition: ControllerObjectDefinition = {},
  ): typeof Controller => {
    class NewController<X extends Element> extends Controller<X> {}

    const { STATIC = {}, ...controllerDefinitionWithoutStatic } =
      controllerDefinition;

    // set up static values
    Object.entries(STATIC).forEach(([key, value]) => {
      NewController[key] = value;
    });

    // set up class methods
    Object.assign(NewController.prototype, controllerDefinitionWithoutStatic);

    return NewController;
  };
}

/**
 * Initialises the Wagtail Stimulus application and dispatches and registers
 * custom event behaviour.
 *
 * Loads the supplied core controller definitions into the application.
 * Turns on debug mode if in local development (for now).
 */
export const initStimulus = ({
  debug = process.env.NODE_ENV === 'development',
  definitions = [],
  root = document.documentElement,
}: {
  debug?: boolean;
  definitions?: Definition[];
  root?: HTMLElement;
} = {}): Application => {
  const application = WagtailApplication.start(root);

  application.debug = debug;

  /**
   * Register a custom action option that will only run the action if the
   * event's target is an element with an id that aligns with the current
   * URL fragment hash.
   *
   * @see https://stimulus.hotwired.dev/reference/actions#options
   * @see https://developer.mozilla.org/en-US/docs/Web/CSS/:target
   *
   * @example
   * // URL: https://example.com/#primary
   * // Will click this button on page load when ID is in the url
   * <button id="primary" data-controller="w-action" data-action="readystatechange@document->w-action#click:target">Primary</button>
   */
  application.registerActionOption(
    'target',
    ({ element, value }) =>
      (document.querySelector('*:target') === element) === value,
  );

  application.load(definitions);

  return application;
};
