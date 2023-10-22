import { Application } from '@hotwired/stimulus';
import { CondController } from './CondController';
import { escapeHtml } from '../utils/text';

jest.useFakeTimers();

describe('CondController', () => {
  const _ = (value) => escapeHtml(JSON.stringify(value));

  let application;
  let errors = [];

  const setup = async (html) => {
    document.body.innerHTML = `<main>${html}</main>`;

    application = Application.start();
    application.register('w-cond', CondController);

    application.handleError = (error, message) => {
      errors.push({ error, message });
    };

    await jest.runAllTimersAsync();
  };

  afterEach(() => {
    application?.stop();
    jest.clearAllMocks();
    errors = [];
  });

  describe('basic behaviour for each target type', () => {
    it('should provide a way to conditionally enable a target', async () => {
      await setup(`
    <form data-controller="w-cond" data-action="change->w-cond#resolve">
      <input type="checkbox" id="agreement-field" name="agreement">
      <button
        type="button"
        disabled
        data-w-cond-target="enable"
        data-match="${_({ agreement: 'on' })}"
      >
        Continue
      </button>
    </form>`);

      const checkbox = document.querySelector('#agreement-field');
      const button = document.querySelector('[data-w-cond-target="enable"]');

      expect(checkbox.checked).toBe(false);
      expect(button.disabled).toBe(true);

      checkbox.click();
      await jest.runAllTimersAsync();

      expect(checkbox.checked).toBe(true);
      expect(button.disabled).toBe(false);

      checkbox.click();
      await jest.runAllTimersAsync();

      expect(checkbox.checked).toBe(false);
      expect(button.disabled).toBe(true);
    });

    it('should provide a way to conditionally disable a target', async () => {
      await setup(`
    <form data-controller="w-cond" data-action="change->w-cond#resolve">
      <select
        id="source-select"
        name="source"
      >
        <option value="">---</option>
        <option value="search">Found us online</option>
        <option value="signage">Found us on a sign</option>
        <option value="other">Other</option>
        <option value="custom">Custom</option>
      </select>
      <input
        id="other-entry-field"
        type="text"
        value="other-source"
        disabled
        data-w-cond-target="disable"
        data-match="${_({ source: ['', 'search', 'signage'] })}"
      />
    </form>`);

      const select = document.getElementById('source-select');
      const input = document.getElementById('other-entry-field');

      expect(select.value).toBe('');
      expect(input.disabled).toBe(true);

      select.value = 'search';

      select.dispatchEvent(new Event('change', { bubbles: true }));

      await jest.runAllTimersAsync();

      expect(select.value).toBe('search');
      expect(input.disabled).toBe(true);

      select.value = 'other';

      select.dispatchEvent(new Event('change', { bubbles: true }));
      await jest.runAllTimersAsync();

      expect(select.value).toBe('other');
      expect(input.disabled).toBe(false);

      select.value = 'signage';

      select.dispatchEvent(new Event('change', { bubbles: true }));
      await jest.runAllTimersAsync();

      expect(select.value).toBe('signage');
      expect(input.disabled).toBe(true);

      select.value = 'custom';

      select.dispatchEvent(new Event('change', { bubbles: true }));
      await jest.runAllTimersAsync();

      expect(select.value).toBe('custom');
      expect(input.disabled).toBe(false);
    });

    it('should provide a way to conditionally hide a target', async () => {
      await setup(`
    <form id="form" data-controller="w-cond" data-action="change->w-cond#resolve">
      <fieldset id="question">
        <legend>Is the page author a member of this website?</legend>
        <input type="radio" id="is-author-yes" name="is-author" value="yes" />
        <label for="is-author-yes">Yes</label>
        <input type="radio" id="is-author-no" name="is-author" value="no" checked />
        <label for="is-author-no">Dewey</label>
      </fieldset>
      <div
        id="custom-author"
        data-w-cond-target="hide"
        data-match="${_({ 'is-author': 'yes' })}"
      >
        <input id="author-name-field" type="text" name="author-name" />
        <input id="author-email-field" type="text" name="author-email" />
      </div>
    </form>`);

      const container = document.getElementById('custom-author');
      expect(container.hidden).toBe(false);

      document.getElementById('is-author-yes').checked = true;
      document.getElementById('is-author-no').checked = false;

      document.getElementById('form').dispatchEvent(new Event('change'));
      await jest.runAllTimersAsync();

      expect(container.hidden).toBe(true);
    });

    it('should provide a way to conditionally show a target', async () => {
      await setup(`
    <form id="form" data-controller="w-cond" data-action="change->w-cond#resolve">
      <div
        id="alert"
        data-w-cond-target="show"
        data-match="${_({ email: '' })}"
      >
        Please enter your email before continuing.
      </div>
      <input type="email" id="email-field" name="email" />
      <input type="text" id="name-field" name="name" />
    </form>`);

      const nameField = document.getElementById('name-field');
      const emailField = document.getElementById('email-field');

      const alert = document.getElementById('alert');
      expect(alert.hidden).toBe(false);

      // add a non-empty email value
      emailField.value = 'joe@email.co';

      emailField.dispatchEvent(new Event('change', { bubbles: true }));
      await jest.runAllTimersAsync();

      expect(alert.hidden).toBe(true);

      // reset the value to empty
      emailField.value = '';

      emailField.dispatchEvent(new Event('change', { bubbles: true }));
      await jest.runAllTimersAsync();

      expect(alert.hidden).toBe(false);
    });
  });

  describe('supporting different data-match attributes', () => {
    it('should support malformed matching and not error', async () => {
      await setup(`
    <form data-controller="w-cond" data-action="change->w-cond#resolve">
      <input type="text" name="title" value="bad" />
      <input type="text" name="subtitle" data-w-cond-target="show" data-match="{title:''}" />
      <div role="alert" data-w-cond-target="show" data-match="title=bad">
        Careful with this value.
      </div>
    </form>
      `);

      expect(
        Array.from(document.querySelectorAll('[data-w-cond-target]')).map(
          (target) => target.hidden,
        ),
      ).toEqual([false, false]);

      expect(errors).toHaveLength(0);
    });
  });

  describe('the ability for the controller to be activated or deactivated', () => {
    it('should remove itself as a controlled element if it connects with no targets by default', async () => {
      await setup(`
    <form data-controller="w-cond" data-action="change->w-cond#resolve">
      <input type="checkbox" name="ignored" />
      <input type="text" id="note" name="note" />
    </form>`);

      expect(
        document.querySelector('form').getAttribute('data-controller'),
      ).toBeFalsy();
    });

    it('should remove itself, by default, as a controlled element if the last targeted element is removed', async () => {
      await setup(`
    <form data-controller="w-cond" data-action="change->w-cond#resolve">
      <input type="checkbox" name="ignored" />
      <input type="text" id="note" name="note" data-w-cond-target="show" />
    </form>`);

      expect(
        document.querySelector('form').getAttribute('data-controller'),
      ).toBe('w-cond');

      document.getElementById('note').remove();
      await jest.runAllTimersAsync();

      expect(
        document.querySelector('form').getAttribute('data-controller'),
      ).toBeFalsy();
    });

    it('should not check for the form data if there are no targets if persist is true', async () => {
      const handleResolved = jest.fn();

      document.addEventListener('w-cond:resolved', handleResolved);

      await setup(`
    <form data-controller="w-cond" data-action="change->w-cond#resolve" data-w-cond-persist-value="true">
      <input type="checkbox" name="ignored" />
      <input type="text" id="note" name="note" />
    </form>`);

      const noteField = document.getElementById('note');

      expect(
        document.querySelector('form').getAttribute('data-controller'),
      ).toBeTruthy();

      expect(handleResolved).not.toHaveBeenCalled();

      document
        .querySelector('input')
        .dispatchEvent(new Event('change', { bubbles: true }));
      await jest.runAllTimersAsync();

      expect(handleResolved).not.toHaveBeenCalled();

      // add a target & trigger a change event

      noteField.setAttribute('data-w-cond-target', 'show');
      await jest.runAllTimersAsync();

      expect(handleResolved).toHaveBeenCalledTimes(1);

      noteField.dispatchEvent(new Event('change', { bubbles: true }));
      await jest.runAllTimersAsync();

      expect(handleResolved).toHaveBeenCalledTimes(2);

      // now remove the target and check that the event no longer fires

      noteField.remove();

      document
        .querySelector('input')
        .dispatchEvent(new Event('change', { bubbles: true }));

      await jest.runAllTimersAsync();

      expect(handleResolved).toHaveBeenCalledTimes(2);
    });
  });

  describe('syncing the state of the DOM (targets) once connected', () => {
    it('should ensure that the enabled/disabled attributes sync once connected', async () => {
      await setup(`
    <form id="form" data-controller="w-cond">
      <fieldset>
        <input type="password" name="password" />
        <input type="email" name="email" />
        <input type="checkbox" name="remember" />
      </fieldset>
      <label for="">This is my device.</label>
      <input
        type="checkbox"
        id="my-device-check"
        name="my-device"
        data-w-cond-target="enable"
        data-match="${_({ remember: 'on' })}"
      />
      <button
        type="button"
        id="continue-button"
        data-w-cond-target="disable"
        data-match="${_({ email: '', password: '' })}"
      >
        Continue
      </button>
    </form>`);

      expect(document.getElementById('my-device-check').disabled).toBe(true);
      expect(document.getElementById('continue-button').disabled).toBe(true);
    });

    it('should ensure that the hide/show attributes sync once connected', async () => {
      await setup(`
    <form id="form" data-controller="w-cond">
      <fieldset>
        <input type="password" name="password" />
        <input type="email" name="email" />
        <input
          type="checkbox"
          name="remember"
          id="remember-me-field"
          data-w-cond-target="hide"
          data-match="${_({ email: '', password: '' })}"
        />
      </fieldset>
      <label for="">This is my device.</label>
      <div
        id="alert"
        data-w-cond-target="show"
        data-match="${_({ remember: 'on' })}"
      >
        Cookies will be saved to this device.
      </div>
      <button type="button">Continue</button>
    </form>`);

      expect(document.getElementById('alert').hidden).toBe(true);
      expect(document.getElementById('remember-me-field').hidden).toBe(true);
    });
  });

  describe('combining targets & elements for more complex interaction', () => {
    it('should allow show and hide targets to be used together', async () => {
      await setup(`
    <form id="form" data-controller="w-cond" data-action="change->w-cond#resolve">
      <div
        id="alert"
        data-w-cond-target="show"
        data-match="${_({ email: '' })}"
      >
        Please enter your email before continuing.
      </div>
      <input type="email" id="email-field" name="email" />
      <input
        type="text"
        id="name-field"
        name="name"
        hidden
        data-w-cond-target="hide"
        data-match="${_({ email: '' })}"
      />
    </form>`);

      const emailField = document.getElementById('email-field');
      const nameField = document.getElementById('name-field');

      const alert = document.getElementById('alert');
      expect(alert.hidden).toBe(false);
      expect(nameField.hidden).toBe(true);

      // add an email value
      emailField.value = 'joe@email.co';

      emailField.dispatchEvent(new Event('change', { bubbles: true }));
      await jest.runAllTimersAsync();

      // alert should hide and the email field should become visible
      expect(alert.hidden).toBe(true);
      expect(nameField.hidden).toBe(false);

      // now clear the email value
      emailField.value = '';

      emailField.dispatchEvent(new Event('change', { bubbles: true }));
      await jest.runAllTimersAsync();

      expect(alert.hidden).toBe(false);
      expect(nameField.hidden).toBe(true);
    });

    it('should support conditional enabling of sets of fields based on a select field', async () => {
      await setup(`
    <form class="w-mb-10" data-controller="w-cond" data-action="change->w-cond#resolve">
      <select name="filter_method" id="id_filter_method" value="original">
        <option value="original">Original size</option>
        <option value="width">Resize to width</option>
        <option value="height">Resize to height</option>
        <option value="min">Resize to min</option>
        <option value="max">Resize to max</option>
        <option value="fill">Resize to fill</option>
      </select>
      <fieldset>
        <input
          type="number"
          name="width"
          value="150"
          id="id_width"
          disabled
          data-w-cond-target="enable"
          data-match="${_({
            filter_method: ['fill', 'max', 'min', 'width'],
          })}"
        />
        <input
          type="number"
          name="height"
          value="162"
          id="id_height"
          disabled
          data-w-cond-target="enable"
          data-match="${_({
            filter_method: ['fill', 'height', 'max', 'min'],
          })}"
        />
        <input
          type="number"
          name="closeness"
          value="0"
          id="id_closeness"
          disabled
          data-w-cond-target="enable"
          data-match="${_({ filter_method: ['fill'] })}"
        />
      </fieldset>
    </form>
      `);

      const filterField = document.getElementById('id_filter_method');
      const widthField = document.getElementById('id_width');
      const heightField = document.getElementById('id_height');
      const closenessField = document.getElementById('id_closeness');

      expect(filterField.value).toEqual('original');

      // should all be disabled at the start (original selected)

      expect(widthField.disabled).toBe(true);
      expect(heightField.disabled).toBe(true);
      expect(closenessField.disabled).toBe(true);

      // now change the filter to width

      filterField.value = 'width';

      filterField.dispatchEvent(new Event('change', { bubbles: true }));
      await jest.runAllTimersAsync();

      expect(widthField.disabled).toBe(false);
      expect(heightField.disabled).toBe(true);
      expect(closenessField.disabled).toBe(true);

      // now change the filter to height

      filterField.value = 'height';

      filterField.dispatchEvent(new Event('change', { bubbles: true }));
      await jest.runAllTimersAsync();

      expect(widthField.disabled).toBe(true);
      expect(heightField.disabled).toBe(false);
      expect(closenessField.disabled).toBe(true);

      // now change the filter to max

      filterField.value = 'max';

      filterField.dispatchEvent(new Event('change', { bubbles: true }));
      await jest.runAllTimersAsync();

      expect(widthField.disabled).toBe(false);
      expect(heightField.disabled).toBe(false);
      expect(closenessField.disabled).toBe(true);

      // now change the filter to fill

      filterField.value = 'fill';

      filterField.dispatchEvent(new Event('change', { bubbles: true }));
      await jest.runAllTimersAsync();

      expect(widthField.disabled).toBe(false);
      expect(heightField.disabled).toBe(false);
      expect(closenessField.disabled).toBe(false);

      // set back to original

      filterField.value = 'original';

      filterField.dispatchEvent(new Event('change', { bubbles: true }));
      await jest.runAllTimersAsync();

      expect(filterField.value).toEqual('original');
      expect(widthField.disabled).toBe(true);
      expect(heightField.disabled).toBe(true);
      expect(closenessField.disabled).toBe(true);
    });
  });

  describe('using as a filtered-select', () => {
    beforeEach(async () => {
      await setup(`
  <form
    data-controller="w-cond"
    data-action="change->w-cond#resolve"
  >
    <label for="continent-field">Continent</label>
    <select id="continent-field" name="continent">
      <option value="">--------</option>
      <option value="1">Europe</option>
      <option value="2">Africa</option>
      <option value="3">Asia</option>
    </select>
    <label for="country-field">Country</label>
    <select id="country-field" name="country">
      <option value="">--------</option>
      <option
        value="1"
        data-w-cond-target="show"
        data-match='${_({ continent: ['', 3] })}'
      >
        China
      </option>
      <option
        value="2"
        data-w-cond-target="show"
        data-match='${_({ continent: ['', 2] })}'
      >
        Egypt
      </option>
      <option
        value="3"
        data-w-cond-target="show"
        data-match='${_({ continent: ['', 1] })}'
      >
        France
      </option>
      <option
        value="4"
        data-w-cond-target="show"
        data-match='${_({ continent: ['', 1] })}'
      >
        Germany
      </option>
      <option
        value="5"
        data-w-cond-target="show"
        data-match='${_({ continent: ['', 3] })}'
      >
        Japan
      </option>
      <option
        value="6"
        data-w-cond-target="show"
        data-match='${_({ continent: ['', 1, 3] })}'
      >
        Russia
      </option>
      <option
        value="7"
        data-w-cond-target="show"
        data-match='${_({ continent: ['', 2] })}'
      >
        South
       Africa</option>
      <option
        value="8"
        data-w-cond-target="show"
        data-match='${_({ continent: ['', 1, 3] })}'
      >
        Turkey
      </option>
    </select>
  </form>`);
    });

    const getShownOptions = () =>
      Array.from(document.getElementById('country-field').options)
        .filter((option) => !option.hidden)
        .map((option) => option.value);

    const allOptions = ['', '1', '2', '3', '4', '5', '6', '7', '8'];

    it('it should show all options by default', async () => {
      expect(getShownOptions()).toEqual(allOptions);
    });

    it('it should hide some options based on the selection within another field', async () => {
      const continentField = document.getElementById('continent-field');

      expect(getShownOptions()).toEqual(allOptions);

      continentField.value = '2'; // Africa

      continentField.dispatchEvent(new Event('change', { bubbles: true }));
      await jest.runAllTimersAsync();

      expect(getShownOptions()).toEqual(['', '2', '7']);

      continentField.value = 1; // Europe - intentionally using int

      continentField.dispatchEvent(new Event('change', { bubbles: true }));
      await jest.runAllTimersAsync();

      expect(getShownOptions()).toEqual(['', '3', '4', '6', '8']);

      continentField.value = ''; // clear selection

      continentField.dispatchEvent(new Event('change', { bubbles: true }));
      await jest.runAllTimersAsync();

      expect(getShownOptions()).toEqual(allOptions);
    });

    it('should clear a selected option if it is being hidden/disabled', async () => {
      const continentField = document.getElementById('continent-field');
      const countryField = document.getElementById('country-field');

      expect(getShownOptions()).toEqual(allOptions);

      countryField.value = '8'; // Turkey
      countryField.dispatchEvent(new Event('change', { bubbles: true }));

      await jest.runAllTimersAsync();

      expect(countryField.value).toEqual('8');

      // now change the continent to an incompatible value (Africa)
      continentField.value = '2'; // Africa

      continentField.dispatchEvent(new Event('change', { bubbles: true }));
      await jest.runAllTimersAsync();

      expect(getShownOptions()).toEqual(['', '2', '7']);
      expect(countryField.value).toEqual('');
    });
  });
});
