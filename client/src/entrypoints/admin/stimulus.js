import { Application, defaultSchema } from '@hotwired/stimulus';

/**
 *
 */
const SCHEMA = { ...defaultSchema };

/**
 * Extending the built in class for housing additional logic.
 *
 */
class WagtailApplication extends Application {
  // ...
}

const Stimulus = WagtailApplication.start(document.documentElement, SCHEMA);

Stimulus.debug = process.env.NODE_ENV === 'development';

const initEvent = new CustomEvent('wagtail:stimulus-init', {
  bubbles: true,
  cancelable: false,
  detail: {
    register: (identifier, controller) => {
      Stimulus.register(identifier, controller);
      Stimulus.logDebugActivity('registered', identifier);
    },
  },
});

document.body.dispatchEvent(initEvent);
