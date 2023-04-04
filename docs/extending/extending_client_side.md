(extending_client_side)=

# Extending client-side behaviour

Many kinds of common customisations can be done without reaching into JavaScript, but depending on what parts of the client-side interaction you want to leverage or customise, you may need to employ React, Stimulus, or vanilla (plain) JS.

[React](https://reactjs.org/) is used for more complex parts of Wagtail, such as the sidebar, commenting system, and the Draftail rich-text editor.
For basic JavaScript-driven interaction, Wagtail is migrating towards [Stimulus](https://stimulus.hotwired.dev/).

You don't need to know or use these libraries to add your custom behaviour to elements, and in many cases vanilla (plain) JavaScript will work fine, but Stimulus is the recommended approach for anything that vanilla JavaScript can't do.

You don't need to have Node.js tooling running for your custom Wagtail installation for many customisations built on these libraries, but in some cases, such as building packages, it may make more complex development easier.

```{note}
it's recommended that you avoid using jQuery as this will be removed in a future version of Wagtail.
```

(extending_client_side_injecting_javascript)=

## Adding custom JavaScript

Within Wagtail's admin interface, there are a few ways to add JavaScript.

The simplest way is to add global JavaScript files via hooks, see [](insert_editor_js) and [](insert_global_admin_js).

For JavaScript added when a specific Widget is used you can add an inner `Media` class to ensure that the file is loaded when the widget is used, see [Django's docs on their form `Media` class](https://docs.djangoproject.com/en/stable/topics/forms/media/#assets-as-a-static-definition).

In a similar way, Wagtail's [template components](template_components) provide a `media` property or `Media` class to add scripts when rendered.

These will ensure the added files are used in the admin after the core JavaScript admin files are already loaded.

(extending_client_side_using_events)=

## Extending with DOM events

When approaching client-side customisations or adopting new components, try to keep the implementation simple first, you may not need any knowledge of Stimulus, React, JavaScript Modules or a build system to achieve your goals.

The simplest way to attach behaviour to the browser is via DOM Events and plain (vanilla) JavaScript.

For example, if you want to attach some logic to a field value change in Wagtail you can add an event listener, check if it's the correct element and change what you need.

```javascript
// myapp/static/js/events.js
document.addEventListener('change', function (event) {
    if (event.target) {
        console.log('field has changed', event.target);
    }
});
```

Alternatively, you can write JavaScript logic to achieve this by listening to all click events and checking if the clicked element corresponds to the comments section.

```javascript
// myapp/static/js/events.js
document.addEventListener('click', function (event) {
    if (!event.target) return;

    isCommentsToggle = event.target.matches(
        '[data-side-panel-toggle="comments"]',
    );

    if (!isCommentsToggle) return;
    console.log('Comments have been toggled');
});
```

Then, you can register this with the `insert_global_admin_js` hook.

```python
# myapp/wagtail_hooks.py
from django.templatetags.static import static
from django.utils.safestring import mark_safe

from wagtail import hooks

@hooks.register('insert_global_admin_js')
def global_admin_js():
    return mark_safe(
        f'<script src="{static("js/events.js")}"></script>',
    )
```

### Wagtail's custom DOM events

-   Wagtail supports some custom behaviour via listening or dispatching custom DOM events, usually with the prefix `wagtail:` or `w-` for specific Stimulus controllers.
-   See [Images title generation on upload](images_title_generation_on_upload).
-   See [Documents title generation on upload](docs_title_generation_on_upload).

(extending_client_side_stimulus)=

## Extending with Stimulus

Wagtail uses [Stimulus](https://stimulus.hotwired.dev/) as a way to provide lightweight client-side interactivity where React isn't required.
You can use Stimulus to easily build custom JavaScript widgets within the admin interface.
The key benefit of using Stimulus is that your code can avoid the need for manual initialisation when widgets appear dynamically in the browser. Such as within modals, `InlinePanels` or `StreamField` panels.

### Understanding the basics of Stimulus

The [Stimulus documentation](https://stimulus.hotwired.dev/) is the best source on how to work with and understand Stimulus, here is a basic overview though.

#### HTML first

Consider the HTML structure of your components first, especially accessibility, Stimulus is built on top of HTML and will work best if you have a well-structured DOM.

#### [Controllers](https://stimulus.hotwired.dev/reference/controllers)

Controllers are [JavaScript classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes) that extend the Stimulus base `Controller`. They get connected to an element with the `data-controller` attribute, one element can have multiple controllers.
A Controller is registered with an identifier, a `kebab-case` string that allows the controller to be referenced in data attributes on your HTML, try to keep your Controllers small in scope within the DOM and in their functionality.
Controllers have methods that define the main behaviour, plus a few built-in callbacks for `connect`, `disconnect`, and others specific to the values set up.

#### [Targets](https://stimulus.hotwired.dev/reference/targets)

Simple Controllers can use the `this.element` to get their controlled element, reach for targets if you need to have access to other DOM elements in your Controller code and avoid using DOM selectors within the JavaScript.

Target elements are attached to the Controller instance with the `data-...-target` attribute, for example `<span data-my-controller-name-target="label"></span>`.

#### [Values](https://stimulus.hotwired.dev/reference/values)

Values are both the initial HTML-driven data for controllers and allow stateful/reactive behaviour. You must declare a value type and an optional default within your controller.
Values are declared in the initial HTML on the controlled element with the `data-...-value` attribute, for example `<section data-controller="my-controller" data-my-controller-delay-value="300">...</section>`.

#### [Actions](https://stimulus.hotwired.dev/reference/actions)

A simple and powerful way to attach DOM event listeners to any element within your controlled element, letting you react to events such as `click` or `hover` and triggering a Controller method. No JavaScript is needed for this, it's all declarative in your HTML and Stimulus will clean up event listeners for you.

The `data-action` attribute is used, for example `<button type="button" data-action="click->my-controller#open">Open</button>`, where `click` is the event, separated by an `->` and then the controller's identifier with a `#methodName`.

### Adding a custom Stimulus controller

Wagtail exposes a single client-side global (`window.Stimulus`), which is an instance of the core admin Stimulus application.

You need to first create a custom [Stimulus Controller](https://stimulus.hotwired.dev/reference/controllers). This can be done in two main ways, depending on your set-up:

1. Create a **custom Class** that extends the base `window.Stimulus.use.Controller` using class inheritance. If you are using a build tool you can extend `import { Controller } from '@hotwired/stimulus';`.
2. If you are unable to work with classes, build one with `window.Stimulus.use.createController` which accepts **an object using the [method definitions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Method_definitions) approach**, with a special `STATIC` property for static properties.

Once you have created your custom controller, you will need to [register your Stimulus controllers manually](https://stimulus.hotwired.dev/reference/controllers#registering-controllers-manually) via the `window.Stimulus.register` method.

#### A simple example

First, create your HTML so that appears somewhere within the Wagtail admin.

```html
<!-- Will log 'My controller has connected: hi' to the console -->
<div data-controller="my-controller">Hi</div>
<!-- Will log 'My controller has connected: hello' to the console, with the span element-->
<div data-controller="my-controller">
    Hello
    <span data-my-controller-target="label"></span>
</div>
```

Second, create a JavaScript file that will contain your Controller code.
This Controller logs a simple message on `connect`, which is once the Controller has been created and connected to a HTML element with the matching `data-controller` attribute.

```javascript
// myapp/static/js/example.js

// 1. With classes
(() => {
    class MyController extends window.Stimulus.use.Controller {
        static targets = ['label'];
        connect() {
            console.log(
                'My controller has connected:',
                this.element.innerText,
                this.labelTargets,
            );
        }
    }

    window.Stimulus.register('my-controller', MyController);
})();

// OR 2. With Objects
(() => {
    const MyController = {
        STATIC: { targets: ['label'] },
        connect() {
            console.log(
                'My controller has connected:',
                this.element.innerText,
                this.labelTargets,
            );
        },
    };

    window.Stimulus.register(
        'my-controller',
        window.Stimulus.use.createController(MyController),
    );
})();
```

Third, load the JavaScript file into Wagtail's admin with a hook.

```python
# myapp/wagtail_hooks.py
from django.templatetags.static import static
from django.utils.safestring import mark_safe

from wagtail import hooks

@hooks.register('insert_global_admin_js')
def global_admin_js():
    return mark_safe(
        f'<script src="{static("js/example.js")}"></script>',
    )
```

You should now be able to refresh your admin page that was showing the HTML and see two logs in the console.

#### A word count controller example without a build system

This is a more complex example, we will create a Controller that adds a small `output` element next to the controlled `input` element that shows a count of how many words have been typed.

```javascript
// myapp/static/js/word-count-controller.js
// By passing the `window.Stimulus` to the immediate function call we can have simpler code
((Stimulus) => {
    class WordCountController extends Stimulus.use.Controller {
        static values = { max: { default: 10, type: Number } };

        connect() {
            this.setupOutput();
            this.updateCount();
        }

        setupOutput() {
            if (this.output) return;
            const template = document.createElement('template');
            template.innerHTML = `<output name='word-count' for='${this.element.id}' style='float: right;'></output>`;
            const output = template.content.firstChild;
            this.element.insertAdjacentElement('beforebegin', output);
            this.output = output;
        }

        updateCount(event) {
            const value = event ? event.target.value : this.element.value;
            const words = (value || '').split(' ');
            this.output.textContent = `${words.length} / ${this.maxValue} words`;
        }

        disconnect() {
            this.element && this.element.remove();
        }
    }
    Stimulus.register('word-count', WordCountController);
})(window.Stimulus);
```

This lets the data attribute values determine the 'configuration' of this controller and the data attribute actions to determine the 'triggers' for the updates to the output element.

```python
# models.py
from django import forms

from wagtail.admin.panels import FieldPanel
from wagtail.models import Page


class BlogPage(Page):
    # ...
    content_panels = Page.content_panels + [
        FieldPanel('subtitle', classname="full"),
        FieldPanel(
            'introduction',
            classname="full",
            widget=forms.TextInput(
                attrs={
                    'data-controller': 'word-count',
                    # allow the max number to be determined with attributes
                    # note we can use Python values here, Django will handle the string conversion (including escaping if applicable)
                    'data-word-count-max-value': 5,
                    # decide when you want the count to update with data-action
                    # (e.g. 'blur->word-count#updateCount' will only update when field loses focus)
                    'data-action': 'word-count#updateCount paste->word-count#updateCount',
                }
            )
        ),
    #...
```

This next code snippet shows a slightly more advanced version of the `insert_editor_js` hook usage which is set up to easily append additional scripts for future controllers.

```python
# wagtail_hooks.py
from django.utils.html import format_html_join
from django.templatetags.static import static

from wagtail import hooks


@hooks.register('insert_editor_js')
def editor_js():
    # add more controller code as needed
    js_files = ['js/word-count-controller.js',]
    return format_html_join('\n', '<script src="{0}"></script>',
        ((static(filename),) for filename in js_files)
    )
```

You should be able to see that on your Blog Page, all introduction fields will now have a small `output` element showing the count and max words being used.

#### A word count controller example with a build system

You can import the base controller from the global Stimulus application or if you have a build tooling set up you can install `@hotwired/stimulus` using `npm install @hotwired/stimulus --save`.

```{warning}
Usage of `class ... extends` from the globally provided `window.Stimulus.use.Controller` cannot be done outside if your code bundles to ES5.
You will need to use the package provided `Controller` as a base in this case, or update your build output to be ES6/ES2015 or above.
```

```javascript
// myapp/static/js/word-count-controller.js
// const { Controller } = window.Stimulus.use; // if you do not want to use an alias or import your package
import { Controller } from '@hotwired/stimulus';

class WordCountController extends Controller {
    // ... the same as above
}

window.Stimulus.register('word-count', WordCountController);
```

-   How you import the script will depend on your build solution, but a similar `wagtail_hooks.py` approach can be used.
-   Using the data attributes in your `FieldPanel`'s `widget` will work exactly the same.

#### Additional tips for bundling

You may want to avoid bundling Stimulus with your JavaScript output, you will need to look at how your build system can support this. You may also need to ensure your target bundle is ES2015 or above to be able to correctly extend the global base Controller class.

For bundler-specific handling of external dependencies or aliasing, see the following links.

-   [Vite library mode](https://vitejs.dev/guide/build.html#library-mode), which uses Rollup configuration
-   [Rollup external](https://rollupjs.org/configuration-options/#external) and [Rollup output globals](https://rollupjs.org/configuration-options/#output-globals)
-   [Webpack externals](https://webpack.js.org/configuration/externals/)
-   [Parcel aliases](https://parceljs.org/features/dependency-resolution/#aliases)

### Using an existing Stimulus controller in HTML

```{warning}
While many Stimulus controllers are in use, this doesn't imply stable and documented usage is supported for all.
```

The Stimulus approach aligns with this philosophy by relying on data attributes that can be often set when declaring Django Widgets and Wagtail Panels in Python or the HTML templates.
For commonly used Controllers there may already be a Django widget or `FieldPanel` approach that supports your requirements already.

Any built-in admin Stimulus Controller can be used via the Stimulus data attributes. These attributes can be declared in the HTML template for the content being used.
All Wagtail's Controllers have identifiers that are prefixed with `w-`.

#### Examples of using the `w-progress` Controller

The `w-progress` Controller is used to help the user avoid clicking the same button multiple times when there may be some delayed behaviour required. Custom usage of this is supported for usage within the admin interface.

-   `<button ... data-w-progress-duration-value="500" ...>` - custom duration can be declared on the element
-   `<button ... class="custom-button" data-w-progress-active-class="custom-button--busy" ...>` - custom 'active' class to replace the default `button-longrunning-active` (must be a single string without spaces)
-   `<button ... ><strong data-w-progress-target="label">{% trans 'Create' %}</strong></button>` - any element can be the button label (not just `em`)
-   `<button ... data-action="w-progress#activate focus->w-progress#activate" ...>` - any event can be used to trigger the in-progress behaviour
-   `<button ... data-action="w-progress#activate:once" ...>` - only trigger the progress behaviour once
-   `<button ... data-action="readystatechange@document->w-progress#activate:once" data-w-progress-duration-value="5000" disabled ...>` - disabled on load (once JS starts) and becomes enabled after 5s duration

### Debugging & error handling

For simple debugging, you can enable the [Stimulus debug mode](https://stimulus.hotwired.dev/handbook/installing#debugging).

```javascript
window.Stimulus.debug = true;
```

You can use also the built-in [Stimulus error callback](https://stimulus.hotwired.dev/handbook/installing#error-handling) for more robust error handling.

```javascript
window.onerror = console.error;
```

### Testing your Controllers

Wagtail uses an out-of-the-box Stimulus application instance, you should be able to write your tests with your package.json installation of Stimulus without issue.
You should not need to mock the `Stimulus.use.Controller`, it's best you write your Controllers as extending `import {Controller} from '@hotwired/stimulus';` and then use any build tooling to redirect this to the global scope in production builds.

### Advanced Stimulus overrides

While these kinds of overrides are supported as a last-ditch method to fully customise behaviour, writing this kind of code will require you to understand the existing implementations and support the JavaScript on your own. it's also important to note that the maintenance burden will be on your project to ensure that any functionality added or changes to controller identifiers are supported.

If you find yourself reaching for this to fix a bug, please take the time to raise this issue on the Wagtail repository with your functional workaround.

Similarly, if some common Stimulus Controller usage would be helpful for the community, such as additional values, targets, DOM events or methods, please raise an issue with the suggestion.

For additional guidance on building Stimulus controllers, you can view the [](ui_guidelines_stimulus) aimed at Wagtail contributors.

#### Registering a custom Stimulus application instance

One of the simplest ways to add behaviour on top of Wagtail's existing Controllers is to create your Stimulus application.
This is useful if you want to append to the existing behaviour of known Controllers.
Please note that non-blocking (async) errors will be thrown and shown in the console if methods are triggered by Stimulus actions if the method doesn't exist.

In the example below we can attach, but not override, custom behaviour to the `w-dismissible` methods.

```javascript
((Stimulus) => {
    const StimulusExtra = Stimulus.start(); // start will instantiate the class and return its new instance
    class SlugCheckController extends Stimulus.use.Controller {
        compare() {
            // noop
        }
        slugify() {
            window.myCustomChecks.validate(this.element);
        }
        urlify() {
            window.myCustomChecks.validate(this.element);
        }
    }
    StimulusExtra.register('w-slug', SlugCheckController);
})(window.Stimulus);
```

#### Extending an existing Stimulus controller

For more extreme customisations it's possible to retrieve an existing registered Controller from the Stimulus application instance. You can extend it using ES2015 class inheritance and then register the extended controller again with the same identifier.

Depending on the timing of your JavaScript code event firing, replacing built-in controllers may also result in certain side effects.

The example below is a basic functional way to extend and override an existing controller.
Stimulus' only documented way of retrieving a Controller constructor is via the [`getControllerForElementAndIdentifier`](https://stimulus.hotwired.dev/reference/controllers#directly-invoking-other-controllers) method on the application.
You can also retrieve all registered Controllers via `window.Stimulus.controllers`, but this approach isn't officially supported by Stimulus.

Once you have the Controller class, you can use `window.Stimulus.unload` to remove the registration of the existing one and then replace it with your custom Controller class using `window.Stimulus.register`.

Here is a basic example of this override.

```javascript
(() => {
    const identifier = 'w-slug';
    const element = document.querySelector(`[data-controller="${identifier}"]`);

    if (!element) return;

    const SlugController = window.Stimulus.getControllerForElementAndIdentifier(
        element,
        identifier,
    );

    class CustomSlugController extends SlugController {
        slugify() {
            // custom url slug
        }
        urlify() {
            // custom url slug
        }
    }
    Stimulus.register('w-slug', CustomSlugController);
})();
```

#### Completely overriding existing admin behaviour of Stimulus controllers

Wagtail also allows you to register a controller against its main application instance, see the examples above or the events reference for these events.

You can completely override the built-in controllers by using the same `identifier` (usually starts with `w-`) and registering your controller with that identifier.

it's important to note that your custom controller will need to re-implement the existing methods or you will get console errors when these are called.

There may also be some side effects of built-in controllers being registered, depending on the timing of your JavaScript code event firing.

```javascript
(() => {
    class CustomSlugController extends window.Stimulus.use.Controller {
        slugify() {
            // custom url slug
        }
        urlify() {
            // custom url slug
        }
    }
    Stimulus.register('w-slug', CustomSlugController);
})();
```

(extending_client_side_react)=

## Extending with React

To customise or extend the [React](https://reactjs.org/) components, you may need to use React too, as well as other related libraries.

To make this easier, Wagtail exposes its React-related dependencies as global variables within the admin. Here are the available packages:

```javascript
// 'focus-trap-react'
window.FocusTrapReact;
// 'react'
window.React;
// 'react-dom'
window.ReactDOM;
// 'react-transition-group/CSSTransitionGroup'
window.CSSTransitionGroup;
```

Wagtail also exposes some of its own React components. You can reuse:

```javascript
window.wagtail.components.Icon;
window.wagtail.components.Portal;
```

Pages containing rich text editors also have access to:

```javascript
// 'draft-js'
window.DraftJS;
// 'draftail'
window.Draftail;

// Wagtail’s Draftail-related APIs and components.
window.draftail;
window.draftail.DraftUtils;
window.draftail.ModalWorkflowSource;
window.draftail.ImageModalWorkflowSource;
window.draftail.EmbedModalWorkflowSource;
window.draftail.LinkModalWorkflowSource;
window.draftail.DocumentModalWorkflowSource;
window.draftail.Tooltip;
window.draftail.TooltipEntity;
```

## Extending Draftail

See [](extending_the_draftail_editor)
