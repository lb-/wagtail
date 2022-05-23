# Stimulus in Wagtail

## Overview

-   New folder `client/src/controllers` where each file is one Stimulus controller, with the filename `my-controller.ts`.
-   If the controller has a static method `isIncludedInCore = true;` then it will be automatically included in the core JS bundle and registered.
-   Controllers must will be registered with the prefix `w` (e.g. `w-tabs`).
-   Controllers are classes and will allow for class inheritance to build on top of base behaviour for variations.
-   Multiple controllers can be attached to one DOM element for composing behaviour.
-   This will be documented in the development docs as the preferred way to add basic JavaScript interactions (if HTML & CSS cannot perform the functionality on their own).
-   React will still be used for very complex discrete UI components, Telepath will still be used as a data pickle/un-pickle convention if required for more complex data handling.
-   Note: There is an `.eslintrc` file in this folder, this is so we can provide some stricter guard-rails for controller classes as code is set up.

## What is Stimulus

-   Stimulus is a modest JavaScript framework that provides an approach to attach a class (aka controller) to a DOM element via a `data-controller` attribute.
-   Due to the usage of `MutationObserver`, no kind of 'init' scripts are needed even if the HTML element with the data attribute is added dynamically (e.g. a server side rendered modal with content).
-   Stimulus provides a way to easily attach event listeners to DOM elements via `data-action` attributes and specify targets for the controller via `data-target` attributes. It also provides a way to have reactive values via `data-...-value` attributes, these value attributes also create a clean 'API' for any controller where the values, options or initial data are set in the HTML.

## UI Development Documentation (DRAFT)

### How to build a controller

1. Start with the HTML, build as much of the component or UI element as you can in HTML alone, even if that means a few variants if there is state to consider. Ensure it is accessible and follows the CSS guidelines.
2. Once you have the HTML working, add a new `*-controller.ts` file, a test file and a stories file. Try to decide on a simple name (on word if possible) and name your controller.
3. Add a `connect` method, this is similar to the `constructor` but gets called once the DOM is ready and the JS is instantiated against your DOM element.
4. You can access the base element with `this.element`, review the Stimulus documentation for full details.

### Stimulus best practices

-   Smaller controllers that do a small amount of 'work' that is collected together, instead of lots of large controllers.
-   Think about the HTML, use Django templates, consider template overrides and blocks to provide a nice way for more custom behaviour to be added later.
-   Use data-attributes where possible, as per the documented approach, to add event listeners and target elements. It is ok to add event listeners in the controller but opt for the `data-action` approach first.
-   Use `this.dispatch` when dispatching `CustomEvent`s to the DOM and whenever possible provide a cancellable behaviour. Events are the preferred way to communicate between controllers and as a bonus provide a nice external API.

## Roadmap

1. [ ] Feedback from UI team (external PR)
2. [ ] Feedback from core team (Wagtail PR)
3. [ ] Get initial base into core
4. [ ] Phase 1 - Migrate Tabs, Breadcrumbs, new Modal + Modal trigger
5. [ ] Phase 2 - Anything that can be removed from `<script />` tags - e.g. `data-sprite`/`loadIconSprite`
6. [ ] Phase 3 - Review all non-modal workflow static_src items (modeladmin/prepopulate, images focus, sitesettings siteswitcher, image-url-generator)
7. [ ] Phase 4 - Collapse, Dropdowns, LockUnlockAction,
8. [ ] Phase 5 - Tag field, dirty form check, others from core.js, auto resize text area
9. [ ] Phase 6 - Larger (one of modal workflow, inline panel, bulk actions, depending on state of project)
10. [ ] Further customisations made available in core (provide a `controller` to extend, maybe provide easy access to the `application`)

## TODO

-   [ ] A way to trigger development mode with a controller and wagtail setting instead (so it can work for non-core dev)
-   [ ] working story book stories for skip link & upgrade notification
-   [ ] maybe something non-core (e.g. image focus thing)
-   [ ] ad-hoc event to register
-   [ ] get the fetch test working better, provide a callback

## Wagtail Documentation (DRAFT)

Wagtail uses [Stimulus](https://stimulus.hotwired.dev/) as a library to provide JavaScript behaviour attached to HTML. Any JavaScript can be added to Wagtail via various hooks and component approaches, however Stimulus provides a light API and makes common DOM targeting, adding event listeners and reactive values easy to work with as a HTML first approach.

-   TODO - add a high level round up of a copy/paste from the Stimulus docs (as most people will not read the external link)

### BYO Controllers

Wagtail does not currently provide a `Controller` to extend in globals or with the event at this time due to the differences between ES5 classes (as a compile target) and ES6 classes. This means you have to bring your own controller.

### Adding a new controller (without a build system)

```python
# wagtail_hooks.py
from wagtail.core import hooks
from wagtail.admin.site_summary import SummaryItem


class NumberPanel(SummaryItem):
    order = 50
    template_name = "base/number_summary.html"


@hooks.register('construct_homepage_summary_items')
def add_summary_item(request, summary_items):
    summary_items.append(NumberPanel(request))
```

```html
<!-- templates/base/number_summary.html -->
{% load i18n wagtailadmin_tags %}

<script type="module">
    import { Controller } from 'https://unpkg.com/@hotwired/stimulus/dist/stimulus.js';

    class HelloController extends Controller {
        static targets = ['total'];
        static values = {
            min: { default: 0, type: Number },
            max: { default: 6, type: Number },
        };

        connect() {
            this.reroll();
        }

        reroll() {
            const min = this.minValue;
            const max = this.maxValue;
            this.totalTarget.innerText = Math.floor(
                Math.random() * (max - min + 1) + min,
            );
        }
    }

    document.addEventListener(
        'wagtail:stimulus-init',
        function ({ detail: { register } }) {
            register(['random-number', HelloController]);
        },
        // important: stimulus-init may be called more than once, only run the registration once
        { once: true },
    );
</script>

<li
    data-controller="random-number"
    data-action="mouseout->random-number#reroll"
>
    {% icon name="doc-empty-inverse" %}
    <a href="/"><span data-random-number-target="total"></span> Items</a>
</li>
```


### Adding a new controller v2 - word count limiting (without a build system)

```javascript
// myapp/static/js/word-count-controller.js
import { Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js";

class WordCountController extends Controller {
  static values = { max: { default: 10, type: Number } };

  connect() {
    const output = document.createElement("output");
    output.setAttribute("name", "word-count");
    output.setAttribute("for", this.element.id);
    output.style.float = "right";
    this.element.insertAdjacentElement("beforebegin", output);
    this.output = output;
    this.updateCount();
  }

  setupOutput() {
    if (this.output) return;
    const template = document.createElement("template");
    template.innerHTML = `<output name='word-count' for='${this.element.id}' style='float: right;'></output>`;
    const output = template.content.firstChild;
    this.element.insertAdjacentElement("beforebegin", output);
    this.output = output;
  }

  updateCount(event) {
    const value = event ? event.target.value : this.element.value;
    const words = (value || "").split(" ");
    this.output.textContent = `${words.length} / ${this.maxValue} words`;
  }

  disconnect() {
    this.element && this.element.remove();
  }
}

document.addEventListener(
  "wagtail:stimulus-init",
  ({ detail: { createController, register } }) => {
    register(["word-count", WordCountController]);
  },
  // important: stimulus-init may be called more than once, only run the registration once
  { once: true }
);
```

```python
# models.py
# https://docs.wagtail.org/en/stable/reference/pages/panels.html#fieldpanel
from django import forms

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
                    'data-word-count-max-value': '40',
                    # decide when you want the count to update with data-action (e.g. 'blur->word-count#updateCount' will only update when field loses focus)
                    'data-action': 'word-count#updateCount paste->word-count#updateCount',
                }
            )
        ),
    #...
```

```python
# wagtail_hooks.py
# https://docs.wagtail.org/en/stable/reference/hooks.html
from django.utils.html import format_html_join
from django.templatetags.static import static

from wagtail import hooks


@hooks.register('insert_editor_js')
def editor_js():
    js_files = ['js/word-count-controller.js',]
    # important - must use 'module'
    return format_html_join('\n', '<script src="{0}" type="module"></script>',
        ((static(filename),) for filename in js_files)
    )

```



### Adding a new controller v3 - word count limiting (without a build system or even classes!)

```javascript
// myapp/static/js/word-count-controller.js

const wordCountController = {
  STATIC: {
    values: { max: { default: 10, type: Number } },
  },
  connect: function () {
    this.setupOutput();
    this.updateCount();
  },
  setupOutput: function () {
    if (this.output) return;
    const template = document.createElement("template");
    template.innerHTML = `<output name='word-count' for='${this.element.id}' style='float: right;'></output>`;
    const output = template.content.firstChild;
    this.element.insertAdjacentElement("beforebegin", output);
    this.output = output;
  },
  updateCount: function (event) {
    const value = event ? event.target.value : this.element.value;
    const words = (value || "").split(" ");
    this.output.textContent = `${words.length} / ${this.maxValue} words`;
  },
  disconnect: function () {
    this.element && this.element.remove();
  },
};

document.addEventListener(
  "wagtail:stimulus-init",
  ({ detail: { createController, register } }) => {
    register(["word-count", createController(wordCountController)]);
  },
  // important: stimulus-init may be called more than once, only run the registration once
  { once: true }
);

```

```python
# models.py
# https://docs.wagtail.org/en/stable/reference/pages/panels.html#fieldpanel
from django import forms

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
                    'data-word-count-max-value': '5',
                    'data-action': 'word-count#updateCount paste->word-count#updateCount',
                }
            )
        ),
    #...
```

```python
# wagtail_hooks.py
# https://docs.wagtail.org/en/stable/reference/hooks.html
from django.utils.html import format_html_join
from django.templatetags.static import static

from wagtail import hooks


@hooks.register('insert_editor_js')
def editor_js():
    js_files = ['js/word-count-controller.js',]
    return format_html_join('\n', '<script src="{0}"></script>',
        ((static(filename),) for filename in js_files)
    )

```



### Adding a new controller (with a build system)

-   Install `@hotwired/stimulus` using `npm install @hotwired/stimulus --save`

```javascript
import { Controller } from '@hotwired/stimulus';

class HelloController extends Controller {
    static targets = ['total'];
    static values = {
        min: { default: 0, type: Number },
        max: { default: 6, type: Number },
    };

    connect() {
        this.reroll();
    }

    reroll() {
        const min = this.minValue;
        const max = this.maxValue;
        this.totalTarget.innerText = Math.floor(
            Math.random() * (max - min + 1) + min,
        );
    }
}

document.addEventListener(
    'wagtail:stimulus-init',
    function ({ detail: { register } }) {
        register(['random-number', HelloController]);
    },
    // important: stimulus-init may be called more than once, only run the registration once
    { once: true },
);
```
