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

// dispatch event for any core JS already loaded
document.dispatchEvent(initEvent);

// dispatch event for any other JS loaded async
document.addEventListener(
  'DOMContentLoaded',
  () => {
    document.dispatchEvent(initEvent);
  },
  { once: true },
);

/**
Example usage.

```python
@hooks.register('insert_global_admin_js')
def global_admin_js():
    return mark_safe(
        """
<script type="module">
import { Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js";

class HelloController extends Controller {
  static targets = ["name"];

  connect() {
    console.log("connected");
  }
}

document.addEventListener(
  "wagtail:stimulus-init",
  ({ detail: { register } }) => {
    register("hello", HelloController);
  },
  { once: true }
);
</script>
        """
    )
```
 */
