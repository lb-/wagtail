## Replace jQuery usage in `privacy-switch.js` with vanilla JS & browser APIs

### Is your proposal related to a problem?

As part of [RFC 78](https://github.com/wagtail/rfcs/pull/78) to remove jQuery and replace it with either vanilla (plain) JS or the lightweight framework Stimulus, we have identified a stand-alone file that can be converted with a small amount of effort away from jQuery.

- `client/src/entrypoints/admin/privacy-switch.js` ([link](https://github.com/wagtail/wagtail/blob/main/client/src/entrypoints/admin/privacy-switch.js))
- Current jQuery usage: Document-ready wrapper, attribute selector with `.on('click')` event binding to launch ModalWorkflow, form selection with `.serialize()` for AJAX submission, and jQuery event delegation within modal onload handlers.
- Lines of code ~32 (excluding comments/blanks)

### Describe the solution you'd like

Remove all usage of jQuery utilities, functionality and tooling from this file and replace with vanilla (plain) JavaScript.

#### Requirements

##### Understand where the file is used and how to manually test

- This file is used in the Wagtail admin interface to provide a modal dialog for setting privacy options on pages/documents.
- Manual testing steps:
    1. Log in to the Wagtail admin.
    2. Navigate to the Explorer or Document Explorer.
    3. Click the "Set privacy" button (which has the `data-a11y-dialog-show="set-privacy"` attribute).
    4. Verify that the modal dialog appears.
    5. Submit the form in the modal and verify that the privacy settings are applied correctly.

##### Unit tests

Add a basic Jest unit test file (sibling `.test.js`) covering the main behavior (e.g., element selection, event binding, modal invocation, response handling).

##### Code style

- Use descriptive variable names (`event`, not `e`; `button`, not `btn`).
- Add JSDoc comments for exported functions.
- Use `const`/`let` instead of `var` where appropriate.
- Keep consistency with existing Wagtail code style and conventions.

##### No TypeScript conversion required

The main file does not need TypeScript conversion, but any new shared utilities must be TypeScript.

#### Specific migration steps

##### 1. Replace jQuery selectors

- `$('[data-a11y-dialog-show="set-privacy"]')` → `document.querySelectorAll('[data-a11y-dialog-show="set-privacy"]')`
- `$('form', modal.body)` → `modal.body.querySelector('form')`

##### 2. Replace event binding

- `element.on('click', handler)` → `element.addEventListener('click', handler)`
- Add `event.preventDefault()` explicitly (don't rely on `return false`)
- Add guard checks: `if (!element) return;` before binding

##### 3. Replace value access

- Form submission: use `form.action` instead of `this.action`
- Consider `form.getAttribute('action')` to preserve relative URLs in tests

##### 4. Replace class manipulation

Not applicable for this file.

##### 5. Replace form serialization (if needed)

- `$(this).serialize()` → Use the existing `encodeForm` utility from `client/src/utils/encodeForm.ts` or create if needed.
- Import: `import { encodeForm } from '../../utils/encodeForm';`

##### 6. Replace document ready (if present)

- `$(function() { ... })` → Use `domReady` utility: `import { domReady } from '../../utils/domReady';` then `domReady().then(() => { ... });`

##### 7. Preserve global exports

Not applicable for this file (no global exports).

##### 8. Add unit tests

- Create a sibling `.test.js` file
- Use `describe()` and `it()` with sentence-style test names
- Stub any globals (e.g., `ModalWorkflow`, onload handlers)
- Test main flows: element selection, event triggering, response handling
- See example test structure below

<details>
<summary>Example test structure</summary>

```javascript
describe('privacy-switch entrypoint', () => {
    let trigger;
    let modalOptions;

    beforeEach(() => {
        document.body.innerHTML = `
      <button data-a11y-dialog-show="set-privacy" data-url="/set-privacy/">Set privacy</button>
    `;

        // Stub ModalWorkflow to capture options
        window.ModalWorkflow = jest.fn((opts) => {
            modalOptions = opts;
        });

        // Import the module under test (after globals and DOM are ready)
        jest.isolateModules(() => {
            require('./privacy-switch');
        });

        trigger = document.querySelector(
            '[data-a11y-dialog-show="set-privacy"]',
        );
    });

    afterEach(() => {
        modalOptions = undefined;
        document.body.innerHTML = '';
        delete window.ModalWorkflow;
    });

    it('should open the ModalWorkflow with the expected options on click', () => {
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
        });
        const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');

        trigger.dispatchEvent(clickEvent);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(window.ModalWorkflow).toHaveBeenCalledTimes(1);
        expect(modalOptions.dialogId).toBe('set-privacy');
        expect(modalOptions.url).toBe('/set-privacy/');
        expect(typeof modalOptions.onload.set_privacy).toBe('function');
        expect(typeof modalOptions.onload.set_privacy_done).toBe('function');
    });

    it('should wire form submit to modal.postForm in set_privacy', () => {
        const form = document.createElement('form');
        form.action = '/submit/';
        document.body.appendChild(form);
        const modal = { body: document.body, postForm: jest.fn() };

        trigger.click();
        modalOptions.onload.set_privacy(modal);

        const submitEvent = new Event('submit', {
            bubbles: true,
            cancelable: true,
        });
        const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');
        form.dispatchEvent(submitEvent);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(modal.postForm).toHaveBeenCalledTimes(1);
        expect(modal.postForm).toHaveBeenCalledWith(
            '/submit/',
            expect.any(String),
        );
    });

    it('should dispatch w-privacy:changed and close the modal in set_privacy_done', () => {
        const close = jest.fn();
        const modal = { close };
        const listener = jest.fn();
        document.addEventListener('w-privacy:changed', listener);

        trigger.click();
        modalOptions.onload.set_privacy_done(modal, { is_public: true });

        expect(listener).toHaveBeenCalledTimes(1);
        expect(close).toHaveBeenCalledTimes(1);
    });
});
```

</details>

#### General jQuery migration guidelines

##### Common patterns

| Pattern                  | jQuery                                 | Vanilla replacement                                                              |
| ------------------------ | -------------------------------------- | -------------------------------------------------------------------------------- |
| Document ready           | `$(fn)` or `$(document).ready(fn)`     | `domReady().then(fn)` (import from `utils/domReady`)                             |
| Select by ID             | `$('#id')`                             | `document.getElementById('id')`                                                  |
| Select by selector       | `$(selector)`                          | `document.querySelector(selector)` (single) or `querySelectorAll` (multiple)     |
| Descendant query         | `parent.find(sel)`                     | `parent.querySelector(sel)`                                                      |
| Event binding (single)   | `elem.on('event', fn)`                 | `elem.addEventListener('event', fn)`                                             |
| Event binding (multiple) | `$(sel).on('event', fn)`               | `document.querySelectorAll(sel).forEach(el => el.addEventListener('event', fn))` |
| Get/set value            | `el.val()` / `el.val(v)`               | `el.value` / `el.value = v`                                                      |
| Get/set text             | `el.text()` / `el.text(t)`             | `el.textContent` / `el.textContent = t`                                          |
| Add/remove class         | `el.addClass(c)` / `el.removeClass(c)` | `el.classList.add(c)` / `el.classList.remove(c)`                                 |
| Prevent default          | `return false`                         | `event.preventDefault()`                                                         |
| Form serialization       | `$(form).serialize()`                  | `encodeForm(form)` (import from `utils/encodeForm`)                              |

##### Additional resources

- [You Might Not Need jQuery](https://youmightnotneedjquery.com/)
- [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API)

<details>

<summary>Example `encodeForm` implementation </summary>

```ts
/**
 * Encode form fields into a URL query string format.
 *
 * Converts the values of an HTML form into a URL-encoded query string using
 * `FormData` and `URLSearchParams`. Multiple values for the same field name are
 * preserved. File inputs are represented by their filename to match legacy
 * behavior where jQuery's `.serialize()` produced a string payload.
 *
 * Note: If you need to upload file contents, prefer sending the `FormData`
 * directly with `fetch` rather than using this helper.
 *
 * @see https://developer.mozilla.org/docs/Web/API/FormData
 * @see https://developer.mozilla.org/docs/Web/API/URLSearchParams
 */
export function encodeForm(form: HTMLFormElement): string {
    const formData = new FormData(form);
    const params = new URLSearchParams();

    Array.from(formData.entries()).forEach(([key, value]) => {
        const valueString =
            typeof value === 'string' ? value : (value as File)?.name || '';
        params.append(key, valueString);
    });

    return params.toString();
}
```

</details>

### Describe alternatives you've considered

While this file may not be needed long term if other aspects of the system are replaced with Stimulus, React, or a different approach, we should convert it now to unblock the jQuery removal effort and align with modern best practices.

### Additional context

- This file has been identified as a candidate with simple DOM/event replacements, minimal coupling, and minimal testing impact.
- Some contents of this issue have been written with AI tooling support.

### Working on this

- Anyone can contribute.
- Review our [contributing guidelines](https://docs.wagtail.org/en/latest/contributing/index.html)
- Comment on this issue when you're ready to start
- Remember, if using AI to support your work, please follow our [Generative AI guidelines](https://github.com/wagtail/wagtail?tab=contributing-ov-file#generative-ai)
- When complete, open a pull request against the `main` branch with title and link back to this issue and manual steps to reproduce for testing.
- The pull request (PR) must include screenshots from your own personal validation (manual testing) so that reviewers can verify the changes and your knowledge of the code being changed.
- PRs without screenshots will be blocked until screenshots are provided.

---

## Agent/AI assistant prompt

> This section is an experiment that provides a condensed prompt for AI coding assistants to implement the migration efficiently.

<details>

<summary>Agent/AI assistant prompt</summary>

##### Context

You are helping migrate a JavaScript file away from jQuery to vanilla JavaScript as part of Wagtail's RFC 78 initiative. The file currently uses jQuery for DOM selection, event binding, and basic operations. Your goal is to produce functionally equivalent code using native browser APIs while improving code quality and adding unit tests.

##### File to migrate

`client/src/entrypoints/admin/privacy-switch.js`

##### Original code

```javascript
/* global ModalWorkflow */

import $ from 'jquery';

$(() => {
    /* Interface to set permissions from the explorer / editor */
    $('[data-a11y-dialog-show="set-privacy"]').on(
        'click',
        function setPrivacy() {
            ModalWorkflow({
                dialogId: 'set-privacy',
                url: this.getAttribute('data-url'),
                onload: {
                    set_privacy(modal) {
                        $('form', modal.body).on(
                            'submit',
                            function handleSubmit() {
                                modal.postForm(
                                    this.action,
                                    $(this).serialize(),
                                );
                                return false;
                            },
                        );
                    },
                    set_privacy_done(modal, { is_public: isPublic }) {
                        document.dispatchEvent(
                            new CustomEvent('w-privacy:changed', {
                                bubbles: true,
                                cancelable: false,
                                detail: { isPublic },
                            }),
                        );
                        modal.close();
                    },
                },
            });
            return false;
        },
    );
});
```

##### Tasks

###### 1. Read the existing file

Understand its structure and dependencies (e.g., global `ModalWorkflow`, onload handlers).

###### 2. Refactor jQuery patterns to vanilla JS

- Replace `$(fn)` document ready → `domReady().then(fn)` (import from `client/src/utils/domReady.ts`)
- Replace `$('[data-a11y-dialog-show="set-privacy"]')` → `document.querySelectorAll('[data-a11y-dialog-show="set-privacy"]')`
- Replace `.on('click', fn)` → `.addEventListener('click', fn)`
- Replace `$('form', modal.body)` → `modal.body.querySelector('form')`
- Replace `$(this).serialize()` → `encodeForm(form)` (import from `client/src/utils/encodeForm.ts`)
- Replace `return false` → explicit `event.preventDefault()`
- Use `form.getAttribute('action') || form.action` to handle both relative and absolute action URLs

###### 3. Code quality improvements

- Use `const`/`let` instead of `var`
- Use descriptive variable names (`event` not `e`, `button` not `btn`)
- Add JSDoc comments for the main initialization function
- Explicitly call `event.preventDefault()` (don't rely on `return false`)
- Use modern JS features where appropriate (e.g., arrow functions, template literals)
- Prefer map/filter/reduce over for-loops for array transformations
- Create an `initPrivacySwitch` or `initModalWorkflow` function inside the `domReady` callback to avoid global scope pollution

###### 4. Preserve backward compatibility

- Keep the ModalWorkflow integration exactly as-is
- Maintain the same onload handler structure (`set_privacy`, `set_privacy_done`)
- Preserve the custom event dispatch (`w-privacy:changed`)
- Do not change the `dialogId` or response handling

###### 5. Create a unit test file

`client/src/entrypoints/admin/privacy-switch.test.js`:

- Use `describe()` and `it()` with sentence-style descriptions
- Stub `window.ModalWorkflow` as `jest.fn()` to capture calls
- Set up DOM with a trigger element in `beforeEach()`
- Use `jest.isolateModules()` to import the module after setting up globals
- Test three scenarios:
    1. Clicking trigger opens ModalWorkflow with correct options
    2. Form submission in `set_privacy` handler calls `modal.postForm` with encoded form data
    3. `set_privacy_done` dispatches custom event and closes modal
- Clean up in `afterEach()` (clear DOM, delete global stubs)

###### 6. Do not

- Convert the file to TypeScript (unless it's a new utility)
- Modify ModalWorkflow or other shared infrastructure
- Change the file's module structure (keep it as-is unless it's blocking)
- Add new dependencies for external packages, only those in the utils or that are reasonable abstractions to new utilities

###### 7. Validation

- Run the new tests: `npm test -- client/src/entrypoints/admin/privacy-switch.test.js`
- Check for lint errors: `npm run lint:js`
- Ensure no jQuery imports remain in the file
- Verify that the test file covers the main flows

##### Deliverables

- Refactored `privacy-switch.js` with no jQuery
- New `privacy-switch.test.js` with passing tests
- Brief summary of changes

##### Execution

- Start by reading the target file
- Plan the changes (list jQuery patterns found)
- Implement the refactor
- Add a random comment to each file that's been created or changed that has something along the lines of '// Migrated by AI and I have not reviewed this code yet' to indicate it needs review
- Create the test file
- Run tests to verify
- Summarize the work
- Remind the user to review the code for correctness and to complete manual testing

</details>
