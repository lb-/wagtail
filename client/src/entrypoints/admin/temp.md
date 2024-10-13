> ℹ️ **Part of the [Stimulus 🎛️ RFC 78](https://github.com/wagtail/rfcs/pull/78)**

### Is your proposal related to a problem?

Our current approach for bootstrapping the various date picker widgets rely on inline scripts.

* [`initDateChooser`](https://github.com/wagtail/wagtail/blob/main/wagtail/admin/templates/wagtailadmin/widgets/date_input.html)
* [`initDateTimeChooser`](https://github.com/wagtail/wagtail/blob/main/wagtail/admin/templates/wagtailadmin/widgets/datetime_input.html)
* [`initTimeChooser`](https://github.com/wagtail/wagtail/blob/main/wagtail/admin/templates/wagtailadmin/widgets/time_input.html)

This approach is no longer necessary and is not CSP compliant, hence it would be good to find a better way to achieve the same goals.

### Describe the solution you'd like

With #11644 completed via #11695 we now have an ability to easily dispatch events when an element appears in the DOM using our Stimulus `[InitController`](https://github.com/wagtail/wagtail/blob/main/client/src/controllers/InitController.ts).

We could adopt a similar approach for the date/time widgets as follows.

#### Example for `AdminTimeInput` (1 of 3)

1. Update the input widget to use the data attributes approach in `wagtail/admin/widgets/datetime.py`, no longer using `widget.config_json` but simply the built in Django widget `attrs` adopting the Stimulus `InitController` attributes as needed.
2. Delete `wagtailadmin/widgets/time_input.html` as this will no longer be needed
3. Update `client/src/entrypoints/admin/telepath/widgets.js` so that instead of calling `window.initTimeChooser` it creates a DOM element with the same attributes as the `datetime` widget.
4. Update the JavaScript to include an event listener that calls the global init function in `client/src/entrypoints/admin/date-time-chooser.js`
5. Update the JavaScript to mark the global `window.initTimeChooser` as deprecated in  `client/src/entrypoints/admin/date-time-chooser.js`
6. Complete a similar update for the other two inputs `AdminDateInput` & `AdminDateTimeInput` (with different event names though)
7. Update unit tests as needed to ensure there are no longer references to the old approach & the new approach is sufficiently tested
8. Add upgrade considerations (this can be added on the PR or in the release notes file) that `window.initTimeChooser` will be deprecated and using the widget or Block (write which ones) is the official way to use these widgets


The code diffs below are just a rough start, these have not been fully tested.

```diff
# wagtail/admin/widgets/datetime.py
# ...

class AdminTimeInput(widgets.TimeInput):
--    template_name = "wagtailadmin/widgets/time_input.html"

    def __init__(self, attrs=None, format=None):
--        default_attrs = {"autocomplete": "off"}
++        default_attrs = {
++            "autocomplete": "off",
++            "data-controller": "w-init",
++            "data-w-init-event-value": "w-time-chooser:init",
++        }
        if attrs:
            default_attrs.update(attrs)
        fmt = format
        if fmt is None:
            fmt = getattr(settings, "WAGTAIL_TIME_FORMAT", DEFAULT_TIME_FORMAT)
        self.js_format = to_datetimepicker_format(fmt)
        super().__init__(attrs=default_attrs, format=fmt)

    def get_config(self):
--        return {"format": self.js_format, "formatTime": self.js_format}
++        return {
++            "format": self.js_format,
++            "formatTime": self.js_format,
++        }

    def get_context(self, name, value, attrs):
++        attrs = attrs or {}
++        attrs["data-w-init-detail-value"] = json.dumps(self.get_config())
        context = super().get_context(name, value, attrs)
--        context["widget"]["config_json"] = json.dumps(self.get_config())
        return context

```


```diff
// file: client/src/entrypoints/admin/telepath/widgets.js
// ...

class BaseDateTimeWidget extends Widget {
  constructor(options) {
    super();
    this.options = options;
  }

  render(placeholder, name, id, initialState) {
--    const element = document.createElement('input');
--    element.type = 'text';
--    element.name = name;
--    element.id = id;
    const element = Object.assign(document.createElement('input'), {
      id,
      name,
      'type': 'text',
      'data-controller': 'w-init',
      'data-w-init-event-value': this.initEventName,
      'data-w-init-detail-value': JSON.stringify({ ...this.options }),
    });

--    this.initChooserFn(id, this.options);
    placeholder.replaceWith(element);

    const widget = {
    // ...
// ... further down in the same file

class AdminTimeInput extends BaseDateTimeWidget {
--  initChooserFn = window.initTimeChooser;
++  initEventName = 'w-time-chooser:init';
}
window.telepath.register('wagtail.widgets.AdminTimeInput', AdminTimeInput);
```

```diff
// client/src/entrypoints/admin/date-time-chooser.js

function initTimeChooser(id, opts) {
  //... initTimeChooser implementation should not change
}
++document.addEventListener('w-time-chooser:init', (event) => {
++  initTimeChooser(event.target.id, event.detail);
++});
++
++ /** @deprecated RemovedInWagtail70 - Remove global.initTimeChooser in a future release */
window.initTimeChooser = initTimeChooser;
```

### Describe alternatives you've considered

* There are plans to fully remove this JavaScript, however, this is likely still 6-18 months away depending on browser support for accessible date/time inputs. https://github.com/wagtail/wagtail/issues/8056
* There was another approach to fully migrate the date widgets to a starting Stimulus implementation, however, this has not been done due to us wanting to remove the date picker JS completely eventually. https://github.com/wagtail/wagtail/pull/10261
* We could leave the code as is, however, this is one of the last handful of inline script usages and we already have a released & proven approach to simply dispatch and listen to events for basic initalisation behaviour.

### Additional context

* This will be an almost identical migration approach to https://github.com/wagtail/wagtail/issues/11644 & https://github.com/wagtail/wagtail/pull/11695 
* This is very similar to the approach in See https://github.com/wagtail/wagtail/issues/11287 & https://github.com/wagtail/wagtail/pull/11294
* This issue is similar in goals to https://github.com/wagtail/wagtail/issues/11597 but taking an intentionally different approach to just leverage an existing controller

### Working on this

* Anyone can contribute to this if they are able to work with Stimulus and create Jest tests, plus feel confident in modifying Python tests.
* View our [contributing guidelines](https://docs.wagtail.org/en/latest/contributing/index.html), add a comment to the issue once you’re ready to start.
