## Replace jQuery usage in `<filename.js>` with vanilla JS & browser APIs

### Is your proposal related to a problem?

As part of [RFC 78](https://github.com/wagtail/rfcs/pull/78) to remove jQuery and replace it with either vanilla (plain) JS or the lightweight framework Stimulus, we have identified a stand-alone file that can be converted with a small amount of effort away from jQuery.

- `<full/path/to/file.js>` ([link](https://github.com/wagtail/wagtail/blob/main/<path-to-file.js>))
- Current jQuery usage: <One sentence summary, e.g. "ID-based selectors, click event binding, and value getters/setters to launch a ModalWorkflow chooser">.
- ~<N> (excluding comments/blanks)

### Describe the solution you'd like

Remove all usage of jQuery utilities, functionality and tooling from this file and replace with vanilla (plain) JavaScript.

#### Requirements

##### Understand where the file is used and how to manually test

- This file is used in <describe where the file is used, e.g. "the Wagtail admin interface to provide a modal dialog for setting privacy options on pages/documents.">
- Manual testing steps:
    1. <Step 1>
    2. <Step 2>
    3. <Step 3>
    4. <Step 4>
    5. <Step 5>

> Only include steps that are necessary to verify the functionality of this specific file if known confidently, otherwise, add a statement that it will need to be determined during implementation.

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

- `$('#id')` → `document.getElementById('id')`
- `$(selector)` → `document.querySelector(selector)` or `document.querySelectorAll(selector)`
- `element.find(selector)` → `element.querySelector(selector)`

##### 2. Replace event binding

- `element.on('click', handler)` → `element.addEventListener('click', handler)`
- Add `event.preventDefault()` explicitly (don't rely on `return false`)
- Add guard checks: `if (!element) return;` before binding

##### 3. Replace value access

- `element.val()` → `element.value`
- `element.text()` → `element.textContent`
- `element.attr('name')` → `element.getAttribute('name')`

##### 4. Replace class manipulation

- `element.addClass('foo')` → `element.classList.add('foo')`
- `element.removeClass('foo')` → `element.classList.remove('foo')`

##### 5. Replace form serialization (if needed)

- `$(form).serialize()` → Use the existing `encodeForm` utility from `client/src/utils/encodeForm.ts` or create if needed.
- Import: `import { encodeForm } from '../../utils/encodeForm';`

##### 6. Replace document ready (if present)

- `$(function() { ... })` → Use `domReady` utility: `import { domReady } from '../../utils/domReady';` then `domReady().then(() => { ... });`

##### 7. Preserve global exports

- If the file exports a function to `window` (e.g., `window.createQueryChooser`), keep that pattern.
- Ensure the function name and signature remain unchanged for backward compatibility.

##### 8. Add unit tests

- Create a sibling `.test.js` file
- Use `describe()` and `it()` with sentence-style test names
- Stub any globals (e.g., `ModalWorkflow`, onload handlers)
- Test main flows: element selection, event triggering, response handling
- See example test structure below

<details>
<summary>Example test structure</summary>

```javascript
describe('<FunctionName or feature description>', () => {
    beforeEach(() => {
        // Set up DOM
        document.body.innerHTML = `
      <button id="test-button" data-url="/test/">Click me</button>
    `;

        // Stub globals if needed (e.g., ModalWorkflow)
        window.ModalWorkflow = jest.fn();
    });

    afterEach(() => {
        document.body.innerHTML = '';
        delete window.ModalWorkflow;
    });

    it('should select the element and bind event listener', () => {
        // Import/execute your code
        // (may need jest.isolateModules for document-ready patterns)

        const button = document.getElementById('test-button');
        button.click();

        expect(window.ModalWorkflow).toHaveBeenCalledTimes(1);
    });

    it('should handle the response callback correctly', () => {
        // Test that response handlers update DOM as expected
        const input = document.createElement('input');
        input.id = 'test-input';
        document.body.appendChild(input);

        // Simulate response
        // responseHandler({ id: 'foo' });

        expect(input.value).toBe('foo');
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

`<full/path/to/file.js>`

##### Tasks

###### 1. Read the existing file

Understand its structure and dependencies (e.g., global `ModalWorkflow`, onload handlers).

###### 2. Refactor jQuery patterns to vanilla JS

- Replace `$('#id')` → `document.getElementById('id')`
- Replace `$(selector)` → `document.querySelector(selector)` or `querySelectorAll`
- Replace `.on('click', fn)` → `.addEventListener('click', fn)`
- Replace `.val()` / `.text()` → `.value` / `.textContent`
- Replace `.addClass()` / `.removeClass()` → `.classList.add()` / `.classList.remove()`
- If form serialization is present: import and use `encodeForm` from `client/src/utils/encodeForm.ts`
- If document-ready wrapper exists: import and use `domReady` from `client/src/utils/domReady.ts`
- Add null checks: `if (!element) return;` before operations

###### 3. Code quality improvements

- Use `const`/`let` instead of `var`
- Use descriptive variable names (`event` not `e`, `button` not `btn`)
- Add JSDoc comments for any exported functions
- Explicitly call `event.preventDefault()` (don't rely on `return false`)
- Use modern JS features where appropriate (e.g., arrow functions, template literals, map/filter/reduce)
- Prefer map/filter/reduce over for-loops for array transformations
- Avoid creating global scope pollution where it looks as though the file may imported into other contexts (e.g. create inner functions inside the `domReady` callback)

###### 4. Preserve backward compatibility

- Keep any `window.*` exports (e.g., `window.createQueryChooser = createQueryChooser;`)
- Maintain the same function signatures and behavior, including consideration of jQuery-specific quirks
- Do not change global variable names or onload handler expectations

###### 5. Create a unit test file

`<filename>.test.js` sibling:

- Use `describe()` and `it()` with sentence-style descriptions
- Stub any globals (e.g., `window.ModalWorkflow = jest.fn()`)
- Set up DOM in `beforeEach()`, clean up in `afterEach()`
- Test: element selection, event binding, callback invocation, response handling
- Use `jest.isolateModules()` if the file has side effects on import
- Example structure:
    ```javascript
    describe('Feature name', () => {
        beforeEach(() => {
            document.body.innerHTML = '<button id="test">Click</button>';
            window.ModalWorkflow = jest.fn();
        });
        afterEach(() => {
            document.body.innerHTML = '';
            delete window.ModalWorkflow;
        });
        it('should bind click handler and invoke ModalWorkflow', () => {
            const button = document.getElementById('test');
            button.click();
            expect(window.ModalWorkflow).toHaveBeenCalledTimes(1);
        });
    });
    ```

###### 6. Do not

- Convert the file to TypeScript (unless it's a new utility)
- Modify ModalWorkflow or other shared infrastructure
- Change the file's module structure (keep it as-is unless it's blocking)
- Add new dependencies for external packages, only those in the utils or that are reasonable abstractions to new utilities

###### 7. Validation

- Run the new tests: `npm test -- <path/to/file>.test.js`
- Check for lint errors: `npm run lint:js`
- Ensure no jQuery imports remain in the file
- Update any Eslint/Jest configs that may no longer need to flag jQuery usage

##### Deliverables

- Refactored `<filename>.js` with no jQuery
- New `<filename>.test.js` with passing tests
- Brief summary of changes

##### Execution

- Start by reading the target file
- Plan the changes (list jQuery patterns found)
- Implement the refactor
- Create the test file
- Run tests to verify
- Summarize the work

</details>
