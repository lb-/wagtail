import type { ControllerConstructor, Definition } from '@hotwired/stimulus';
import { Application, Controller } from '@hotwired/stimulus';

type ControllerObjectDefinition = Record<string, () => void> & {
  STATIC?: {
    classes?: string[];
    targets?: string[];
    values: typeof Controller.values;
  };
};

/**
 * Function that accepts a plain old object and returns a Stimulus Controller.
 * Useful for convenient class creation for those not comfortable with classes in JS.
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
const createController = (
  controllerDefinition: ControllerObjectDefinition = {},
  BaseController = Controller,
): ControllerConstructor => {
  class NewController<X extends Element> extends BaseController<X> {}

  const { STATIC = {}, ...controllerDefinitionWithoutStatic } =
    controllerDefinition;

  const staticValues = { ...STATIC };
  const classDefinition = controllerDefinitionWithoutStatic;

  // set up static values
  Object.entries(staticValues).forEach(([key, value]) => {
    NewController[key] = value;
  });

  // set up class methods
  Object.assign(NewController.prototype, classDefinition);

  return NewController;
};

interface WagtailApplication extends Application {
  use: {
    createController: typeof createController;
    Controller: typeof Controller;
  };
}

/**
 * Initialises the Wagtail Stimulus application and dispatches and registers
 * custom event behaviour. Adds convenience access for Controller creation
 * to the application instance created so that these are not included in any
 * custom usage of the original Application class.
 *
 * Loads the supplied core Controller definitions into the Application.
 * Turns on debug mode if in local development (for now).
 */
export const initStimulus = ({
  debug = process.env.NODE_ENV === 'development',
  definitions = [],
  element = document.documentElement,
}: {
  debug?: boolean;
  definitions?: Definition[];
  element?: HTMLElement;
} = {}): WagtailApplication => {
  const application = Application.start(element) as WagtailApplication;

  application.use = { createController, Controller };
  application.debug = debug;
  application.load(definitions);

  return application;
};
