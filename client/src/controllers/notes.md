## Original functionality (panels)

-   `initAnchoredPanels` - Scroll (smoothly) to the panel container if it is the target (URL hash fragment) once document loading is complete.
-   On load, and other key dynamic events such as inline panel creation, instantiate `data-panel` with collapse/expand logic.
-   Dispatch an event `wagtail:panel-init` for every panel that is instantiated, dispatch on the toggle. Changed: `w-panel:ready` and now dispatched on the controlled panel, not the toggle.
-  Open the panel if any `beforematch` is fired within the content.
-  Allow clicking the header, if present, to toggle the panel.
-  Allow clicking the toggle to toggle te panel.
-  Allow the panel to be forced closed when instantiated if the class 'collapsed' has been added to the container but only if there are no errors inside the content.
-  Sets the initial aria-expanded value on toggles (if not set) based on open/closed state, defaulting to open. Setting this value whenever the state changes.
-  If no content is set or can be determined via aria-controls, do not instantiate.
-  Dispatch an event to indicate when the state has changed on panels. `commentAnchorVisibilityChange`. This has been replaced with an event aligned with the Stimulus approach, `w-panel:changed`.
-  By default, when the panel closes it should set the `hidden` attribute. It can set this to `'until-found'` if the browser supports this behaviour. It should remove `hidden` once opened.
-  New: Add discrete `opening`, `opened`, `closing`, `closed` events. Opening/closing can have their default prevented to stop the change.
-  New: Changed API for how the description can be determined, these are read out via the targets (similar to the data-panel-heading-text), but now is a bit more flexible and can be accessed via the dispatched events AND the controller instance.
-  New: Errors logged to console if the panel has been set up with invalid HTML (no aria-controls, no content).
-  New: data-panel is the controlled element, the previous approach looked for the toggle to attach to and then found the nearest panel. This means that data-controller="w-panel" will only be added if the desired JS behaviour is wanted.


Testing

1. Attempt to add a panel somewhere on the page in a teamplate (e.g. home / dashboard) so that it picks up on HTML load. Confirm it gets converted to a new panel
2. Attempt to add the same panel JS dynamically (in the inspector is fine). Confirm it gets converted to a new panel.

```html
<div class="w-header__description" data-panel>
  <button type="button" data-panel-toggle aria-controls="test" aria-expanded="true">admin User</button>
  <div id="test">CONTENT</div>
</div>
```

