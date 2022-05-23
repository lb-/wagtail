/* eslint-disable max-classes-per-file */
import { Application, Controller, defaultSchema } from '@hotwired/stimulus';

import controllerDefinitions from '../controllers';

const noop = () => null;

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
 *   "wagtail:stimulus-init",
 *   ({ detail: { register } }) => {
 *     register(["hello", HelloController]);
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

const initStimulus = () => {
  const application = WagtailApplication.start(
    document.documentElement,
    WagtailApplication.SCHEMA,
  );

  application.debug = process.env.NODE_ENV === 'development';

  application.load(controllerDefinitions);

  /**
   * WIP - function that accepts a plain old object and returns a Controller.
   * Useful when ES6 modules with base class being extended not in use
   * or build tool not in use or for just super convenient class creation.
   * API not final - not sure if `STATIC` or `STATICS` or start with underscore?
   * Inspired heavily by
   * https://github.com/StackExchange/Stacks/blob/develop/lib/ts/stacks.ts#L68
   *
   * Also should pull this out to its own file for unit testing
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
    Object.entries(controllerDefinition.STATIC || {}).forEach(
      ([key, value]) => {
        NewController[key] = value;
      },
    );

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

  const getInitEvent = (order: number): CustomEvent =>
    new CustomEvent('wagtail:stimulus-init', {
      bubbles: true,
      cancelable: false,
      detail: {
        // intentionally not providing the application - may add this in a future release if needed
        order,
        // provide a way to create a controller without ES6, base controller, or transpiled classes
        createController,
        // provide a way to register controllers
        register: ([identifier, controller]) => {
          application.register(identifier, controller);
          application.logDebugActivity('registered', identifier, { order });
        },
      },
    });

  // dispatch event for any core JS already loaded
  document.addEventListener('readystatechange', () =>
    document.dispatchEvent(
      getInitEvent(document.readyState === 'interactive' ? 0 : 2),
    ),
  );

  // dispatch event for any other JS loaded async
  document.addEventListener(
    'DOMContentLoaded',
    () => document.dispatchEvent(getInitEvent(1)),
    { once: true },
  );
};

export default initStimulus;
