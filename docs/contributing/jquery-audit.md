# jQuery audit November 2025

- Purpose: Inventory jQuery usage across specified files, highlight plugins, summarize features used, and estimate effort to replace with native/modern alternatives.
- Effort scale: `T` (test-only), `S` (small), `M` (medium), `L` (large), `XL` (extra large; plugin removal or complex UI migration).

## File summary

- Columns: `File` · `Lines` · `jQuery Usage Summary` · `Plugins` · `Effort` · `Notes`

| #   | File                                                                                                       | Lines | jQuery Usage Summary                                       | Plugins                         | Effort | Notes                                                                                                                                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------- | ----: | ---------------------------------------------------------- | ------------------------------- | :----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5   | `wagtail/contrib/search_promotions/templates/wagtailsearchpromotions/queries/chooser_field.js`             |    18 | Chooser launch; uses global onload handlers (ajaxify)      | —                               |   S    | Indirect `ajaxifyLinks` usage via QUERY chooser handlers.                                                                                                                                                                    |
| 1   | `client/src/entrypoints/admin/privacy-switch.js`                                                           |    32 | Simple event binding and DOM toggle                        | —                               |   S    | Straightforward swap to native.                                                                                                                                                                                              |
| 2   | `client/src/entrypoints/admin/task-chooser.js`                                                             |    26 | Chooser trigger; relies on modal onload handlers (ajaxify) | —                               |   S    | Indirect use of `ajaxifyLinks` via TASK chooser handlers; side-effects possible. Mostly just event listeners though.                                                                                                         |
| 3   | `client/src/entrypoints/documents/document-chooser-modal.js`                                               |    32 | Overrides `ajaxifyLinks` to augment upload behavior        | —                               |   S    | Direct `ajaxifyLinks` override; hidden interactions with search/upload states.                                                                                                                                               |
| 7   | `client/src/components/StreamField/blocks/FieldBlock.js`                                                   |   214 | Basic DOM+events around field widgets                      | —                               |   S    | Localized updates; straightforward migration.                                                                                                                                                                                |
| 8   | `client/src/components/StreamField/blocks/ListBlock.js`                                                    |   324 | DOM manipulation of lists, event handling                  | —                               |   S    | Replace with native list ops and event delegation.                                                                                                                                                                           |
| 9   | `client/src/components/StreamField/blocks/StructBlock.js`                                                  |   278 | DOM manipulation within structured blocks                  | —                               |   S    | Moderate complexity, large file, but mostly just DOM generation.                                                                                                                                                             |
| 11  | `client/src/entrypoints/admin/task-chooser-modal.js`                                                       |    57 | jQuery event binding, pagination/links ajaxification       | —                               |   M    | Replace with `fetch`, native delegation.                                                                                                                                                                                     |
| 12  | `client/src/entrypoints/admin/workflow-action.js`                                                          |   174 | jQuery AJAX and form submission helpers                    | —                               |   M    | Replace with `fetch/FormData`.                                                                                                                                                                                               |
| 14  | `client/src/entrypoints/images/image-chooser-modal.js`                                                     |   118 | Chooser hooks, AJAX, DOM updates                           | —                               |   M    | Ensure parity with upload/selection flows.                                                                                                                                                                                   |
| 16  | `wagtail/contrib/search_promotions/static_src/wagtailsearchpromotions/js/query-chooser-modal.js`           |    74 | jQuery-driven chooser (`$.ajax`, event binding)            | —                               |   M    | Align with chooser modal refactor.                                                                                                                                                                                           |
| 17  | `wagtail/embeds/static_src/wagtailembeds/js/embed-chooser-modal.js`                                        |    23 | `$.ajax` form submission, basic events                     | —                               |   M    | Swap to native `fetch` + form handling.                                                                                                                                                                                      |
| 18  | `client/src/components/Draftail/sources/ModalWorkflowSource.js`                                            |   340 | Modal workflow integration, event binding, DOM updates     | —                               |   M    | Tightly coupled to legacy `ModalWorkflow` patterns using jQuery, but may be medium if we can find an event dispatch mechanism to close the Bootstrap modals.                                                                 |
| 13  | `client/src/entrypoints/contrib/table_block/table.js`                                                      |   312 | DOM sizing, selections, iterative measurements             | —                               |   L    | Replace with native layout measures; ensure accessibility.                                                                                                                                                                   |
| 20  | `client/src/components/StreamField/blocks/BaseSequenceBlock.js`                                            |   702 | DOM manipulation for StreamField rows; delegated events    | —                               |   L    | Non-trivial due to StreamField structure and dynamic inserts/removals.                                                                                                                                                       |
| 21  | `client/src/components/StreamField/blocks/StreamBlock.js`                                                  |   467 | Complex DOM operations, dynamic block add/remove           | —                               |   L    | High coupling to editor UI; careful rewrite required.                                                                                                                                                                        |
| 22  | `client/src/entrypoints/admin/modal-workflow.js`                                                           |   153 | Legacy modal workflow interactions (`$.ajax`, DOM updates) | —                               |   L    | Central to admin modals; refactor alongside `chooserModal` layer.                                                                                                                                                            |
| 23  | `client/src/entrypoints/admin/page-chooser-modal.js`                                                       |   264 | jQuery in chooser onload handlers, events                  | —                               |   L    | Part of chooser system; coordinate refactor across chooser stack.                                                                                                                                                            |
| 24  | `client/src/entrypoints/contrib/typed_table_block/typed_table_block.js`                                    |   614 | DOM updates, event handlers for typed table                | —                               |   L    | Complex UI behavior.                                                                                                                                                                                                         |
| 25  | `client/src/includes/chooserModal.js`                                                                      |   394 | Heavy use of `$.ajax`, `serialize`, delegated events       | —                               |   L    | Core chooser infra; staged refactor to native APIs recommended.                                                                                                                                                              |
| 19  | `client/src/components/InlinePanel/index.js`                                                               |   363 | Reordering, dynamic form rows, event delegation            | —                               |   XL   | Likely interacts with orderable behaviors; requires careful state management. Part of the `FormsetController` migration. See https://github.com/wagtail/wagtail/pull/13168 & https://github.com/wagtail/wagtail/issues/12940 |
| 10  | `client/src/entrypoints/admin/filtered-select.js`                                                          |    92 | DOM selection, event binding, possibly ajax                | —                               |   XL   | Convert to native events; check any async behavior. Will be fixed by https://github.com/wagtail/wagtail/pull/13380 - see https://github.com/wagtail/wagtail/issues/11045                                                     |
| 15  | `client/src/includes/dateTimeChooser.js`                                                                   |   133 | Event binding, DOM manipulation                            | —                               |   XL   | Replace with native events, but this is awaiting a core team direction - see https://github.com/wagtail/wagtail/issues/8056                                                                                                  |
| 6   | `client/src/components/ExpandingFormset/index.js`                                                          |    61 | Simple DOM selection, class toggles, event handlers        | —                               |   XL   | Replace with native `closest/querySelectorAll` and `addEventListener`, but being replaced with the `FormsetController` see https://github.com/wagtail/wagtail/pull/13168 & https://github.com/wagtail/wagtail/issues/12940   |
| 4   | `wagtail/contrib/search_promotions/templates/wagtailsearchpromotions/includes/searchpromotions_formset.js` |     9 | `InlinePanel` usage                                        | —                               |   XL   | Inline template JS; but plans are to replace with the `FormsetController` see https://github.com/wagtail/wagtail/pull/13168 & https://github.com/wagtail/wagtail/issues/12940                                                |
| 26  | `client/src/controllers/TagController.ts`                                                                  |   126 | jQuery wrapper for tags UI                                 | tag-it                          |   XL   | Uses `tag-it` jQuery plugin; requires custom tags UI or non-jQuery alternative. Awaiting accessibility review of candidate replacement - see https://github.com/wagtail/wagtail/issues/2952                                  |
| 27  | `wagtail/documents/static_src/wagtaildocs/js/add-multiple.js`                                              |   191 | Blueimp jQuery File Upload integration, `$.ajax`, `$.post` | blueimp-fileupload              |   XL   | Plugin removal; rewrite multi-upload UI and progress. Research needed (Flagged in RFC78 project but not done yet).                                                                                                           |
| 28  | `wagtail/images/static_src/wagtailimages/js/add-multiple.js`                                               |   227 | Blueimp jQuery File Upload integration                     | blueimp-fileupload              |   XL   | Plugin removal; parity with documents uploader. Research needed (Flagged in RFC78 project but not done yet).                                                                                                                 |
| 29  | `wagtail/images/static_src/wagtailimages/js/focal-point-chooser.js`                                        |   124 | Jcrop focal point selection, `$.debounce`, events          | Jcrop, jquery-throttle-debounce |   XL   | Plugin removal; custom selection UI and resize handling needed. See https://github.com/wagtail/wagtail/issues/2901 for related request. Research needed (Flagged in RFC78 project but not done yet).                         |
| 30  | `client/src/components/StreamField/blocks/FieldBlock.test.js`                                              |   293 | Test-only: mocks jQuery behaviors                          | —                               |   T    | Update tests once implementation drops jQuery.                                                                                                                                                                               |
| 31  | `client/src/components/StreamField/blocks/ListBlock.test.js`                                               |   815 | Test-only                                                  | —                               |   T    | Testing harness changes only.                                                                                                                                                                                                |
| 32  | `client/src/components/StreamField/blocks/StaticBlock.test.js`                                             |    99 | Test-only                                                  | —                               |   T    | Testing harness changes only.                                                                                                                                                                                                |
| 33  | `client/src/components/StreamField/blocks/StreamBlock.test.js`                                             |  1450 | Test-only                                                  | —                               |   T    | Testing harness changes only.                                                                                                                                                                                                |
| 34  | `client/src/components/StreamField/blocks/StructBlock.test.js`                                             |   963 | Test-only                                                  | —                               |   T    | Testing harness changes only.                                                                                                                                                                                                |
| 35  | `client/src/entrypoints/contrib/typed_table_block/typed_table_block.test.js`                               |   373 | Test-only                                                  | —                               |   T    | Testing harness changes only.                                                                                                                                                                                                |
| 36  | `client/src/entrypoints/contrib/table_block/table.test.js`                                                 |   204 | Test-only                                                  | —                               |   T    | Update tests accordingly.                                                                                                                                                                                                    |

## Additional notes

### Plugins in use

- `tag-it` (jQuery tags input) — used in `client/src/controllers/TagController.ts`
- `blueimp-fileupload` (jQuery File Upload) — used in `wagtail/documents/static_src/wagtaildocs/js/add-multiple.js`, `wagtail/images/static_src/wagtailimages/js/add-multiple.js`
- `Jcrop` (image crop/selection) — used in `wagtail/images/static_src/wagtailimages/js/focal-point-chooser.js`
- `jquery-throttle-debounce` (`$.debounce`) — used in `wagtail/images/static_src/wagtailimages/js/focal-point-chooser.js`

### Effort guidelines

- S: Simple DOM/event replacements; minimal coupling; minimal testing impact.
- M: Multiple event paths, some AJAX/form handling; moderate refactoring and tests.
- L: Complex UI flows (modal/chooser/StreamField); coordinated refactor and broader testing.
- XL: Plugin removal/migration (jQuery-dependent plugin) requiring feature parity with custom or modern alternatives.

### Notes & assumptions

- Where a file primarily contains tests, effort reflects changes to test harnesses after implementation migrates away from jQuery.
- Some files may include indirect jQuery reliance via shared chooser/modal infrastructure; effort reflects that coupling.

## Simple migration plans (S-effort non-test files)

Below are high-level, low-risk migration steps for the five smallest non-test files currently using jQuery. These can be tackled early to reduce overall jQuery surface area and establish patterns for larger refactors.

### `client/src/entrypoints/admin/privacy-switch.js` (S)

Current usage:

- `$(...)` document ready wrapper.
- Attribute selector with `.on('click')` to launch `ModalWorkflow`.
- Inside modal onload handlers: jQuery form selection and `.serialize()` for submission.

Migration steps:

1. Replace `$(...)` ready with `document.addEventListener('DOMContentLoaded', ...)`.
2. Replace selector `[$[data-a11y-dialog-show="set-privacy"]]` jQuery calls with `document.querySelectorAll` and `addEventListener('click', handler, { passive: true })`.
3. In `set_privacy` handler, use `modal.body.querySelector('form')` and `form.addEventListener('submit', ...)`.
4. Replace `$(this).serialize()` with `new URLSearchParams(new FormData(form)).toString()` (or adapt `modal.postForm` to accept FormData directly).
5. Ensure `return false;` patterns are replaced by `event.preventDefault()`.
6. Remove jQuery import once dependent modal code no longer requires jQuery in this file.

### `client/src/entrypoints/admin/task-chooser.js` (S)

Current usage:

- ID concatenation with `$` selectors; `.find()` for descendants.
- Click handler using jQuery to open `ModalWorkflow`.
- DOM updates via jQuery (`val`, `text`, `removeClass`, `attr`).

Migration steps:

1. Replace `$('#' + id + '-chooser')` with `document.getElementById(`${id}-chooser`)`.
2. Replace descendant queries (`chooserElement.find('[data-chooser-title]')`) with `chooserElement.querySelector(...)`.
3. Replace `input.val(...)` with `input.value = ...` and `taskName.text(...)` with `taskName.textContent = ...`.
4. Replace event binding with `querySelectorAll('[data-chooser-action-choose]')` and `addEventListener('click', ...)`.
5. Replace `chooserElement.removeClass('blank')` with `chooserElement.classList.remove('blank')`.
6. Remove jQuery import; keep global export `window.createTaskChooser = createTaskChooser;`.

### `client/src/entrypoints/documents/document-chooser-modal.js` (S)

Current usage:

- jQuery in overridden `ajaxifyLinks`: selecting `a.upload-one-now` and retrieving/setting values via `$('#id_collection_id').val()`.

Migration steps:

1. Remove jQuery import; inside `ajaxifyLinks` use `context.querySelectorAll('a.upload-one-now')`.
2. For each link, `addEventListener('click', handler)`; inside handler retrieve collection ID via `const collection = modal.body.querySelector('#id_collection_id')?.value` (falling back to `document.getElementById` if outside modal scope).
3. Set upload form field with `const uploadCollection = modal.body.querySelector('#id_document-chooser-upload-collection'); if (uploadCollection) uploadCollection.value = collectionId;`.
4. Replace `event.preventDefault()` only (omit `return false`).
5. Confirm base `ChooserModalOnloadHandlerFactory` changes eventually allow removal of any indirect jQuery assumptions.

### `wagtail/contrib/search_promotions/templates/wagtailsearchpromotions/includes/searchpromotions_formset.js` (S)

Current usage:

- jQuery document ready wrapper invoking `new InlinePanel({...})`.

Migration steps:

1. Replace `$(function(){ ... });` with `document.addEventListener('DOMContentLoaded', () => { ... });`.
2. Ensure `InlinePanel` global availability (import if needed in future ES module conversion).
3. Remove jQuery usage entirely; no other changes required.

### `wagtail/contrib/search_promotions/templates/wagtailsearchpromotions/queries/chooser_field.js` (S)

Current usage:

- jQuery ID-based selectors; click handler launching `ModalWorkflow`; jQuery `.val()`.

Migration steps:

1. Convert to vanilla function: `const chooserElement = document.getElementById(id + '-chooser'); const input = document.getElementById(id);`.
2. Replace `chooserElement.on('click', ...)` with `chooserElement.addEventListener('click', ...)`.
3. Set input value via `input.value = queryData.querystring`.
4. Remove jQuery dependency; ensure `ModalWorkflow` remains callable (may require earlier refactor in modal library for full removal).
5. Optionally assign `window.createQueryChooser = createQueryChooser;` if global exposure is needed by server-rendered templates.

### Shared micro-patterns to standardize

| Pattern             | jQuery                                 | Vanilla replacement                                                              |
| ------------------- | -------------------------------------- | -------------------------------------------------------------------------------- |
| Document ready      | `$(fn)`                                | `document.addEventListener('DOMContentLoaded', fn)`                              |
| Select single by ID | `$('#id')`                             | `document.getElementById('id')`                                                  |
| Descendant query    | `parent.find(sel)`                     | `parent.querySelector(sel)`                                                      |
| Multiple nodes      | `$(sel).on('event', fn)`               | `document.querySelectorAll(sel).forEach(el => el.addEventListener('event', fn))` |
| Get/set value       | `el.val()` / `el.val(v)`               | `el.value` / `el.value = v`                                                      |
| Text content        | `el.text()`                            | `el.textContent`                                                                 |
| Add/remove class    | `el.addClass(c)` / `el.removeClass(c)` | `el.classList.add(c)` / `el.classList.remove(c)`                                 |
| Prevent default     | `return false`                         | `event.preventDefault()`                                                         |
| Serialize form      | `$(form).serialize()`                  | `new URLSearchParams(new FormData(form)).toString()`                             |

### Sequencing recommendation

1. Migrate `privacy-switch.js` first (introduces form serialization utility pattern).
2. Migrate chooser micro-files (`task-chooser.js`, `chooser_field.js`).
3. Migrate template initialization (`searchpromotions_formset.js`).
4. Migrate document chooser modal override, keeping parity while awaiting core chooser refactor.
5. After these, update lint config to remove them from the jQuery allowlist, enforcing no regression.

### Risk & validation checklist (S files)

## Medium migration plans (M-effort files)

Focus: Files with moderate complexity (multiple event paths, AJAX calls, indirect chooser side-effects through `ajaxifyLinks`). Goals are to eliminate jQuery incrementally while maintaining behavioral parity.

### Shared medium-tier risks

- Hidden side-effects in chooser onload handlers (`ajaxifyLinks` attaches pagination, selection, multiple-choice states).
- Reliance on jQuery's serialization (`form.serialize()`) and implicit abort handling in `$.ajax`.
- Mixed synchronous + asynchronous DOM updates (e.g. enabling buttons after results load).
- Potential race conditions when rapidly triggering searches / pagination.

### Migration strategy (general)

1. Introduce small utility layer: `dom.ts` with helpers (`qs`, `qsa`, `on`, `serializeForm`).
2. Replace `$.ajax` with `fetch` wrappers supporting abort via `AbortController` where repeated calls occur (search, pagination).
3. Move chooser-related logic toward a central, framework-agnostic module so each chooser file only wires UI specifics.
4. Add lightweight integration tests (or Playwright smoke tests) for chooser open/select flows before refactor.
5. Perform file-by-file conversion; run lint to ensure no jQuery reintroduction.

### Per-file notes & steps

| File                                                                                             | Current Patterns                         | Key Risks                                            | Migration Steps                                                                                              |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `client/src/components/ExpandingFormset/index.js`                                                | Show/hide form rows, class toggling      | Accidental focus loss on dynamic add/remove          | Replace selectors/events; ensure focus management with `focus()` after add.                                  |
| `client/src/components/StreamField/blocks/FieldBlock.js`                                         | Field DOM wrappers, simple events        | Minor: ensures consistent block initialization order | Inline replace; create `initFieldBlock` without jQuery.                                                      |
| `client/src/components/StreamField/blocks/ListBlock.js`                                          | Iterative list manipulation              | Order consistency, event delegation correctness      | Use event delegation via `container.addEventListener`; map jQuery height/width to `getBoundingClientRect()`. |
| `client/src/components/StreamField/blocks/StructBlock.js`                                        | Structured field grouping                | Nested field discovery reliability                   | Replace `.find` with scoped `querySelector`; ensure attributes maintained.                                   |
| `client/src/entrypoints/admin/filtered-select.js`                                                | Change listeners, filtering logic        | Performance with large option sets                   | Convert to native; consider `requestAnimationFrame` batching on large updates.                               |
| `client/src/entrypoints/admin/task-chooser-modal.js`                                             | Modal onload, pagination links           | Pagination race conditions                           | Replace link handlers with delegated `click`; integrate `AbortController` on new requests.                   |
| `client/src/entrypoints/admin/workflow-action.js`                                                | Form submissions via jQuery AJAX         | Error handling divergence                            | Wrap in `fetchWithForm`; maintain status messaging and CSRF token handling.                                  |
| `client/src/entrypoints/contrib/table_block/table.js`                                            | Sizing calculations, dynamic table state | Layout thrash, performance                           | Batch measurements; replace `$(...).height()` calls with cached `clientHeight`.                              |
| `client/src/entrypoints/images/image-chooser-modal.js`                                           | Chooser events, partial reloads          | Inconsistent state after reload                      | Use unified chooser utilities; ensure event rebind after dynamic HTML injection.                             |
| `client/src/includes/dateTimeChooser.js`                                                         | Date/time widget init                    | Accessibility regressions                            | Replace with native or Stimulus controller; test keyboard navigation.                                        |
| `wagtail/contrib/search_promotions/static_src/wagtailsearchpromotions/js/query-chooser-modal.js` | Chooser search & select                  | Race conditions on rapid search                      | Add abortable search; maintain focus after results load.                                                     |
| `wagtail/embeds/static_src/wagtailembeds/js/embed-chooser-modal.js`                              | Single form AJAX submit                  | Error message formatting                             | Simplify to `fetch`, preserve error block injection.                                                         |
| `client/src/entrypoints/admin/task-chooser.js`                                                   | Chooser launch & update                  | Side-effects inside global handlers                  | Vanilla event binding; rely on shared chooser utilities.                                                     |
| `client/src/entrypoints/documents/document-chooser-modal.js`                                     | Overrides `ajaxifyLinks` (upload action) | Hidden coupling to collection selection              | Replace jQuery with vanilla; add explicit function docs for side-effects.                                    |
| `wagtail/contrib/search_promotions/templates/wagtailsearchpromotions/queries/chooser_field.js`   | Launch chooser, set value                | Indirect `ajaxifyLinks` side-effects                 | Vanilla conversion; ensure global handler availability pre-click.                                            |

### Implementation ordering (medium tier)

1. Utility introduction (serialize, abortable fetch, query helpers).
2. Chooser infrastructure adjustments (`chooserModal.js` first) to reduce per-file duplication.
3. Convert simplest mediums: `filtered-select.js`, `dateTimeChooser.js`, `embed-chooser-modal.js`.
4. Convert chooser trigger files (`task-chooser.js`, `chooser_field.js`).
5. Convert modal overrides (`document-chooser-modal.js`, `query-chooser-modal.js`, `image-chooser-modal.js`).
6. StreamField medium blocks (`FieldBlock.js`, `ListBlock.js`, `StructBlock.js`) before large blocks to validate patterns.
7. Performance-sensitive tables (`table.js`).

### Validation checklist (M files)

- Add console warnings diff check (no new jQuery usage after migration).
- Confirm accessibility (tab order, ARIA live regions intact if present).
- Ensure cancellation logic prevents stale content rendering (search/pagination).
- Snapshot test chooser HTML before/after (if feasible) to spot regressions.
- Cross-browser smoke test (Chrome, Firefox, Safari) for dynamic sizing code.

## Stimulus candidates

Scope: Identify cross-cutting behaviors in jQuery modules that are better abstracted as Stimulus controllers, or can reuse existing controllers in `client/src/controllers/**`. Only include items shared by 2+ files or where simple DOM replacement is insufficient.

### Summary mapping

| Candidate                             | Affects                                                                                                                                               | Existing Controller(s)                                                                           | Proposal                                                                                                                               | Why Stimulus                                                                                    |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Chooser trigger + modal lifecycle     | `task-chooser.js`, `document-chooser-modal.js`, `image-chooser-modal.js`, `wagtail/.../query-chooser-modal.js`, `client/src/includes/chooserModal.js` | `DialogController` (open/close), `SubmitController` (AJAX form), `ProgressController` (optional) | New `ChooserController` to unify: trigger click → open ModalWorkflow, wire onload handlers, pagination, multiple select enable/disable | Shared patterns across 4+ choosers; reduces duplication and hidden `ajaxifyLinks` side-effects. |
| Chooser search + pagination (ajaxify) | Same as above + any onload search forms                                                                                                               | — (partial patterns exist in `chooserModal.js` SearchController)                                 | New `ChooserSearchController` (Stimulus) handling debounced input, filter changes, abortable fetch, results swap                       | Centralizes complex async behaviors; improves testability and race-condition handling.          |
| Multiple-choice selection state       | Chooser pages with `[data-multiple-choice-*]`                                                                                                         | —                                                                                                | New `MultipleChoiceController` to manage checkbox state + submit enablement                                                            | Logic duplicated in chooser onload; declarative state is cleaner in Stimulus.                   |
| Formset add/remove rows               | `ExpandingFormset`, `InlinePanel`, StreamField blocks (List/Struct/Field)                                                                             | `FormsetController`                                                                              | Prefer/extend `FormsetController` for consistent row templates, index fixing, focus management                                         | Shared across multiple editors; avoids bespoke jQuery per block.                                |
| Drag-and-drop ordering                | `InlinePanel`, StreamField sequences                                                                                                                  | `OrderableController` (uses SortableJS)                                                          | Use `OrderableController` hooks where ordering exists; emit order change events                                                        | Removes per-file drag logic; consistent UX/accessibility.                                       |
| AJAX form submit + CSRF               | `embed-chooser-modal.js`, `workflow-action.js`, chooser creation forms                                                                                | `SubmitController`                                                                               | Adopt `SubmitController` to submit via `fetch` with CSRF and error region updates                                                      | Uniform error handling and progressive enhancement.                                             |
| Upload with progress                  | `wagtaildocs/js/add-multiple.js`, `wagtailimages/js/add-multiple.js`                                                                                  | `ProgressController` (progress UI), `SubmitController` (forms)                                   | New `UploadController` encapsulating file selection, queue, per-item + overall progress; integrates with ProgressController            | Shared across docs/images; complex state merits a controller abstraction.                       |
| Image focal selection                 | `wagtailimages/js/focal-point-chooser.js`                                                                                                             | —                                                                                                | New `CropController` to replace Jcrop with native overlay interactions; debounced resize                                               | Complex pointer interactions + responsive resize handling; large feature.                       |
| Title prefill from filename           | Chooser creation forms (legacy)                                                                                                                       | `SyncController`                                                                                 | Use `SyncController` value mapping instead of custom jQuery handlers                                                                   | Already migrated in places; finish remaining cases.                                             |

### Notes

- The “ChooserController” family (Trigger, Search, MultipleChoice) can be incremental: keep ModalWorkflow for now, but move link binding, AJAX, and state toggles into Stimulus. That reduces reliance on jQuery’s `ajaxifyLinks` and clarifies side-effects.
- For StreamField and InlinePanel, prefer augmenting existing `FormsetController` and `OrderableController` rather than per-file logic.
- Upload and Crop are XL efforts due to plugin replacements but benefit most from Stimulus abstractions once functionality parity is targeted.
- Confirm no reliance on jQuery event delegation edge cases (all handlers are direct binding).
- Ensure global functions remain exposed as needed for template inline usage.
- Run existing tests (none of these have dedicated tests) plus smoke-test in the UI.
- Verify `ModalWorkflow` still functions with vanilla-calling code (it can still be jQuery internally until refactored).
- https://youmightnotneedjquery.com/ is a great resource for vanilla replacements.
