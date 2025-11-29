# jQuery audit November 2025

- Purpose: Inventory jQuery usage across specified files, highlight plugins, summarize features used, and estimate effort to replace with native/modern alternatives.
- Effort scale: `T` (test-only), `S` (small), `M` (medium), `L` (large), `XL` (extra large; plugin removal or complex UI migration).

## File summary

- Columns: `File` · `Lines` · `jQuery Usage Summary` · `Plugins` · `Effort` · `Notes`

| File                                                                                                       | Lines | jQuery Usage Summary                                       | Plugins                         | Effort | Notes                                                                           |
| ---------------------------------------------------------------------------------------------------------- | ----: | ---------------------------------------------------------- | ------------------------------- | :----: | ------------------------------------------------------------------------------- |
| `client/src/entrypoints/admin/privacy-switch.js`                                                           |    32 | Simple event binding and DOM toggle                        | —                               |   S    | Straightforward swap to native.                                                 |
| `client/src/entrypoints/admin/task-chooser.js`                                                             |    26 | Small DOM interactions                                     | —                               |   S    | Minimal rewrite.                                                                |
| `client/src/entrypoints/documents/document-chooser-modal.js`                                               |    32 | Minimal chooser hooks                                      | —                               |   S    | Depends on modal workflow layer.                                                |
| `wagtail/contrib/search_promotions/templates/wagtailsearchpromotions/includes/searchpromotions_formset.js` |     9 | Document-ready wrapper and simple jQuery usage             | —                               |   S    | Inline template JS; trivial swap.                                               |
| `wagtail/contrib/search_promotions/templates/wagtailsearchpromotions/queries/chooser_field.js`             |    18 | Chooser field event binding                                | —                               |   S    | Minimal changes.                                                                |
| `client/src/components/ExpandingFormset/index.js`                                                          |    61 | Simple DOM selection, class toggles, event handlers        | —                               |   M    | Replace with native `closest/querySelectorAll` and `addEventListener`.          |
| `client/src/components/StreamField/blocks/FieldBlock.js`                                                   |   214 | Basic DOM+events around field widgets                      | —                               |   M    | Localized updates; straightforward migration.                                   |
| `client/src/components/StreamField/blocks/ListBlock.js`                                                    |   324 | DOM manipulation of lists, event handling                  | —                               |   M    | Replace with native list ops and event delegation.                              |
| `client/src/components/StreamField/blocks/StructBlock.js`                                                  |   278 | DOM manipulation within structured blocks                  | —                               |   M    | Moderate complexity.                                                            |
| `client/src/entrypoints/admin/filtered-select.js`                                                          |    92 | DOM selection, event binding, possibly ajax                | —                               |   M    | Convert to native events; check any async behavior.                             |
| `client/src/entrypoints/admin/task-chooser-modal.js`                                                       |    57 | jQuery event binding, pagination/links ajaxification       | —                               |   M    | Replace with `fetch`, native delegation.                                        |
| `client/src/entrypoints/admin/workflow-action.js`                                                          |   174 | jQuery AJAX and form submission helpers                    | —                               |   M    | Replace with `fetch/FormData`.                                                  |
| `client/src/entrypoints/contrib/table_block/table.js`                                                      |   312 | DOM sizing, selections, iterative measurements             | —                               |   M    | Replace with native layout measures; ensure accessibility.                      |
| `client/src/entrypoints/images/image-chooser-modal.js`                                                     |   118 | Chooser hooks, AJAX, DOM updates                           | —                               |   M    | Ensure parity with upload/selection flows.                                      |
| `client/src/includes/dateTimeChooser.js`                                                                   |   133 | Event binding, DOM manipulation                            | —                               |   M    | Replace with native events.                                                     |
| `wagtail/contrib/search_promotions/static_src/wagtailsearchpromotions/js/query-chooser-modal.js`           |    74 | jQuery-driven chooser (`$.ajax`, event binding)            | —                               |   M    | Align with chooser modal refactor.                                              |
| `wagtail/embeds/static_src/wagtailembeds/js/embed-chooser-modal.js`                                        |    23 | `$.ajax` form submission, basic events                     | —                               |   M    | Swap to native `fetch` + form handling.                                         |
| `client/src/components/Draftail/sources/ModalWorkflowSource.js`                                            |   340 | Modal workflow integration, event binding, DOM updates     | —                               |   L    | Tightly coupled to legacy `ModalWorkflow` patterns using jQuery.                |
| `client/src/components/InlinePanel/index.js`                                                               |   363 | Reordering, dynamic form rows, event delegation            | —                               |   L    | Likely interacts with orderable behaviors; requires careful state management.   |
| `client/src/components/StreamField/blocks/BaseSequenceBlock.js`                                            |   702 | DOM manipulation for StreamField rows; delegated events    | —                               |   L    | Non-trivial due to StreamField structure and dynamic inserts/removals.          |
| `client/src/components/StreamField/blocks/StreamBlock.js`                                                  |   467 | Complex DOM operations, dynamic block add/remove           | —                               |   L    | High coupling to editor UI; careful rewrite required.                           |
| `client/src/entrypoints/admin/modal-workflow.js`                                                           |   153 | Legacy modal workflow interactions (`$.ajax`, DOM updates) | —                               |   L    | Central to admin modals; refactor alongside `chooserModal` layer.               |
| `client/src/entrypoints/admin/page-chooser-modal.js`                                                       |   264 | jQuery in chooser onload handlers, events                  | —                               |   L    | Part of chooser system; coordinate refactor across chooser stack.               |
| `client/src/entrypoints/contrib/typed_table_block/typed_table_block.js`                                    |   614 | DOM updates, event handlers for typed table                | —                               |   L    | Complex UI behavior.                                                            |
| `client/src/includes/chooserModal.js`                                                                      |   394 | Heavy use of `$.ajax`, `serialize`, delegated events       | —                               |   L    | Core chooser infra; staged refactor to native APIs recommended.                 |
| `client/src/controllers/TagController.ts`                                                                  |   126 | jQuery wrapper for tags UI                                 | tag-it                          |   XL   | Uses `tag-it` jQuery plugin; requires custom tags UI or non-jQuery alternative. |
| `wagtail/documents/static_src/wagtaildocs/js/add-multiple.js`                                              |   191 | Blueimp jQuery File Upload integration, `$.ajax`, `$.post` | blueimp-fileupload              |   XL   | Plugin removal; rewrite multi-upload UI and progress.                           |
| `wagtail/images/static_src/wagtailimages/js/add-multiple.js`                                               |   227 | Blueimp jQuery File Upload integration                     | blueimp-fileupload              |   XL   | Plugin removal; parity with documents uploader.                                 |
| `wagtail/images/static_src/wagtailimages/js/focal-point-chooser.js`                                        |   124 | Jcrop focal point selection, `$.debounce`, events          | Jcrop, jquery-throttle-debounce |   XL   | Plugin removal; custom selection UI and resize handling needed.                 |
| `client/src/components/StreamField/blocks/FieldBlock.test.js`                                              |   293 | Test-only: mocks jQuery behaviors                          | —                               |   T    | Update tests once implementation drops jQuery.                                  |
| `client/src/components/StreamField/blocks/ListBlock.test.js`                                               |   815 | Test-only                                                  | —                               |   T    | Testing harness changes only.                                                   |
| `client/src/components/StreamField/blocks/StaticBlock.test.js`                                             |    99 | Test-only                                                  | —                               |   T    | Testing harness changes only.                                                   |
| `client/src/components/StreamField/blocks/StreamBlock.test.js`                                             |  1450 | Test-only                                                  | —                               |   T    | Testing harness changes only.                                                   |
| `client/src/components/StreamField/blocks/StructBlock.test.js`                                             |   963 | Test-only                                                  | —                               |   T    | Testing harness changes only.                                                   |
| `client/src/entrypoints/contrib/typed_table_block/typed_table_block.test.js`                               |   373 | Test-only                                                  | —                               |   T    | Testing harness changes only.                                                   |
| `client/src/entrypoints/contrib/table_block/table.test.js`                                                 |   204 | Test-only                                                  | —                               |   T    | Update tests accordingly.                                                       |

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
