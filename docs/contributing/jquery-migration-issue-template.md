## Replace JQuery usage in <short file name summary here> with vanilla JS & browser APIs

### Is your proposal related to a problem?

As part of the [RFC 78](https://github.com/wagtail/rfcs/pull/78) to remove jQuery and replace it with either vanilla (plain) JS or the lightweight framework Stimulus we have identified a stand-alone file that could be converted with a small amount of effort away from jQuery.

The file is [`wagtail/contrib/search_promotions/templates/wagtailsearchpromotions/queries/chooser_field.js`](https://github.com/wagtail/wagtail/blob/main/wagtail/contrib/search_promotions/templates/wagtailsearchpromotions/queries/chooser_field.js).

This file uses jQuery to <insert simple one sentence summary here>.

### Describe the solution you'd like

Remove any usage of the jQuery utilities, functionality and tooling from this file and replace with vanilla (plain) JavaScript. The file does not need to be converted to TypeScript, but any abstracted utilities must be.

This will likely involve the following:

- Adding a basic unit test as part of the migration to uplift test coverage and ensure the code runs as expected.
- Ensuring any new/migrated code has suitable TSDoc comments, see https://tsdoc.org/
- Where possible update the conventions to avoid abbreviated variable names (e.g. use `event`, not `e`, `button`, not `btn`) for code readibility.
- <specific detail item one>
- <specific detail item two, etc>

#### General jQuery migration guidelines

- Any `$(...)` document ready wrappers should be replaced with the Promise based util in the codebase `domReady`.
- <add more items here based on the audit practice>
- Replace selector (e.g. `[$[data-a11y-dialog-show="set-privacy"]]`) jQuery calls with `document.querySelectorAll` or `document.querySelector`, or replace `elem.find` with `elem.querySelector`.
- Replace `elem.on('click'...` with `addEventListener('click', handler, { passive: true })`.
- Any jQuery form serialisation should be replaced with a central utility called `encodeForm` (example code below).

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

While this file may not be needed long term if other aspects of the <chooser or whatever common behaviour is used> get replaced with Stimulus or React or a different approach. For now we should attempt to convert this file to our modern approach so that we are not blocked when we stop using jQuery.

### Additional context

- This file has been identified by myself with the support of AI tooling as a candidate that has simple DOM/event replacements; minimal coupling; minimal testing impact.
- Some of the contents of this issue have been written with the support of AI tooling.
- See https://youmightnotneedjquery.com/ for some other helpful guides on how to migrate individual jQuery functions.

### Working on this

- Anyone can contribute to this.
- View our [contributing guidelines](https://docs.wagtail.org/en/latest/contributing/index.html), add a comment to the issue once you’re ready to start.

### Starting prompt

> This is an experiment, a prompt that could be used to generate the desired outcome for this PR.

<details>

<summary>Prompt </summary>
...
</details>
