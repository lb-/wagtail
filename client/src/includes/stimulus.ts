import { Application, defaultSchema } from '@hotwired/stimulus';

import controllerDefinitions from '../controllers';

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

  const getInitEvent = (order: number): CustomEvent =>
    new CustomEvent('wagtail:stimulus-init', {
      bubbles: true,
      cancelable: false,
      detail: {
        // intentionally not providing the application - may add this in a future release if needed
        order,
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
