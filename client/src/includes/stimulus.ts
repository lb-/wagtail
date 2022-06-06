/* eslint-disable max-classes-per-file */
import {
  Application,
  Controller,
  ControllerConstructor,
  defaultSchema,
} from '@hotwired/stimulus';

import controllerDefinitions from '../controllers';

const noop = () => null;

declare global {
  interface WindowEventMap {
    'wagtail:stimulus-register-controller': CustomEvent<{
      identifier?: string;
      controller?: typeof Controller;
    }>;
  }
}

/**
 * Extending the built in class for housing additional logic.
 *
 * @example - within Wagtail for custom stimulus controllers
 * ```python
 * @hooks.register('insert_global_admin_js')
 * def global_admin_js():
 *     return mark_safe(
 *         """
 * <script type="module">
 * import { Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js";
 *
 * class HelloController extends Controller {
 *   static targets = ["name"];
 *
 *   connect() {
 *     console.log("connected");
 *   }
 * }
 *
 * document.addEventListener(
 *   "wagtail:stimulus-ready",
 *   ({ detail: { register } }) => {
 *     register({identifier: "hello", controller: HelloController});
 *   },
 *   { once: true }
 * );
 * </script>
 *         """
 *     )
 * ```
 *
 */
class WagtailApplication extends Application {
  /**
   * Prepare for a custom schema as required.
   */
  static SCHEMA = { ...defaultSchema };
}

/**
 * Function that accepts a plain old object and returns a Controller.
 * Useful when ES6 modules with base class being extended not in use
 * or build tool not in use or for just super convenient class creation.
 * API not final - not sure if `STATIC` or `STATICS` or start with underscore?
 *
 * Inspired heavily by
 * https://github.com/StackExchange/Stacks/blob/develop/lib/ts/stacks.ts#L68
 *
 */
const createController = (controllerDefinition: {
  STATIC: {
    classes?: string[];
    targets?: string[];
    values: typeof Controller.values;
  };
}): typeof Controller => {
  class NewController extends Controller {}

  // set up static values
  Object.entries(controllerDefinition.STATIC || {}).forEach(([key, value]) => {
    NewController[key] = value;
  });

  // set up class methods
  Object.entries(controllerDefinition)
    .filter(([key]) => !['STATIC'].includes(key))
    .map(([key]) => ({
      key,
      property:
        Object.getOwnPropertyDescriptor(controllerDefinition, key) || noop,
    }))
    .forEach(({ key, property }) => {
      Object.defineProperty(NewController.prototype, key, property);
    });

  return NewController;
};

/**
 * Returns a function that allows for safe controller registration with logging
 * added.
 */
const getRegisterController =
  (
    application: Application,
    onComplete: {
      (options: {
        identifier: string;
        controller: ControllerConstructor;
      }): void;
    },
  ) =>
  ({ controller, identifier }) => {
    if (!identifier) {
      application.logDebugActivity('registration failed', 'no identifier', {
        controller,
        identifier,
      });
      return;
    }
    if (!controller || !identifier) {
      application.logDebugActivity('registration failed', 'no controller', {
        controller,
        identifier,
      });
    }
    application.register(identifier, controller);
    onComplete({ identifier, controller });
  };

const getReadyEvent = (application, order: number): CustomEvent =>
  new CustomEvent('wagtail:stimulus-ready', {
    bubbles: true,
    cancelable: false,
    detail: {
      // intentionally not providing the application - may add this in a future release if needed
      order,
      // provide a way to create a controller without ES6, base controller, or transpiled classes
      createController,
      // provide a way to register controllers
      register: getRegisterController(application, ({ identifier }) =>
        application.logDebugActivity('registered', identifier, {
          order,
          source: 'wagtail:stimulus-ready',
        }),
      ),
    },
  });

const initStimulus = () => {
  const application = WagtailApplication.start(
    document.documentElement,
    WagtailApplication.SCHEMA,
  );

  application.debug = process.env.NODE_ENV === 'development';

  // most code will not be able to listen to this event
  // setting up for any future fallbacks/provision of application or cancelling/modifying core controllers
  document.dispatchEvent(new CustomEvent('wagtail:stimulus-init'));

  application.load(controllerDefinitions);

  // --- Events - dispatched --- //

  /**
   * dispatch event as early as possible and for any core JS already loaded
   */
  document.addEventListener('readystatechange', () =>
    document.dispatchEvent(
      getReadyEvent(application, document.readyState === 'interactive' ? 0 : 2),
    ),
  );

  /**
   * dispatch event for any other JS loaded async
   */
  document.addEventListener(
    'DOMContentLoaded',
    () => document.dispatchEvent(getReadyEvent(application, 1)),
    { once: true },
  );

  // --- Events - listeners --- //

  /**
   * Allow any custom code to trigger debug mode easily.
   */
  window.addEventListener('wagtail:stimulus-enable-debug', () => {
    application.debug = true;
  });

  /**
   * Allow controller to be registered ad-hoc if ready events are not suitable.
   */
  window.addEventListener(
    'wagtail:stimulus-register-controller',
    ({ detail: { identifier, controller } }) =>
      getRegisterController(application, () =>
        application.logDebugActivity('registered', identifier || '', {
          source: 'wagtail:stimulus-register-controller',
        }),
      )({ controller, identifier }),
  );
};

export { createController, initStimulus };
