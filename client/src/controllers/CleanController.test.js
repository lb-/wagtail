import { Application } from '@hotwired/stimulus';
import { CleanController } from './CleanController';

describe('CleanController', () => {
  let application;

  beforeEach(() => {
    application?.stop();

    document.body.innerHTML = `
    <input
      id="id_slug"
      name="slug"
      type="text"
      data-controller="w-clean"
      data-action="blur->w-clean#slugify"
    />`;

    application = Application.start();
    application.register('w-clean', CleanController);
  });

  it('should trim and slugify the input value when focus is moved away from it', async () => {
    const slugInput = document.querySelector('#id_slug');
    slugInput.value = '    slug  testing on     edit page ';

    slugInput.dispatchEvent(new CustomEvent('blur'));

    await new Promise(process.nextTick);

    expect(document.querySelector('#id_slug').value).toEqual(
      'slug-testing-on-edit-page',
    );
  });

  it('should not allow unicode characters by default', async () => {
    const slugInput = document.querySelector('#id_slug');

    expect(
      slugInput.hasAttribute('data-w-clean-allow-unicode-value'),
    ).toBeFalsy();

    slugInput.value = 'Visiter Toulouse en été 2025';

    slugInput.dispatchEvent(new CustomEvent('blur'));

    await new Promise(process.nextTick);

    expect(slugInput.value).toEqual('visiter-toulouse-en-t-2025');
  });

  it('should allow unicode characters when allow-unicode-value is set to truthy', async () => {
    const slugInput = document.querySelector('#id_slug');
    slugInput.setAttribute('data-w-clean-allow-unicode-value', 'true');

    expect(
      slugInput.hasAttribute('data-w-clean-allow-unicode-value'),
    ).toBeTruthy();

    slugInput.value = 'Visiter Toulouse en été 2025';

    slugInput.dispatchEvent(new CustomEvent('blur'));

    await new Promise(process.nextTick);

    expect(slugInput.value).toEqual('visiter-toulouse-en-été-2025');
  });
});

describe('compare behavior', () => {
  let application;

  beforeEach(() => {
    application?.stop();

    document.body.innerHTML = `
      <input
        id="id_slug"
        name="slug"
        type="text"
        data-controller="w-clean"
      />`;

    application = Application.start();
    application.register('w-clean', CleanController);

    const slugInput = document.querySelector('#id_slug');

    slugInput.dataset.action = [
      'blur->w-clean#urlify',
      'custom:event->w-clean#compare',
    ].join(' ');
  });

  it('should not prevent default if input has no value', async () => {
    const event = new CustomEvent('custom:event', {
      detail: { value: 'title alpha' },
    });

    event.preventDefault = jest.fn();

    document.getElementById('id_slug').dispatchEvent(event);

    await new Promise(process.nextTick);

    expect(document.getElementById('id_slug').value).toBe('');
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should not prevent default if the values are the same', async () => {
    document.querySelector('#id_slug').setAttribute('value', 'title-alpha');

    const event = new CustomEvent('custom:event', {
      detail: { value: 'title alpha' },
    });

    event.preventDefault = jest.fn();

    document.getElementById('id_slug').dispatchEvent(event);

    await new Promise(process.nextTick);

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should prevent default using the slugify (default) behavior as the compare function when urlify values is not equal', async () => {
    const slug = document.querySelector('#id_slug');

    const title = 'Тестовий заголовок';

    slug.setAttribute('value', title);

    // apply the urlify method to the content to ensure the value before check is urlify
    slug.dispatchEvent(new Event('blur'));

    await new Promise(process.nextTick);

    expect(slug.value).toEqual('testovij-zagolovok');

    const event = new CustomEvent('custom:event', { detail: { value: title } });

    event.preventDefault = jest.fn();

    slug.dispatchEvent(event);

    await new Promise(process.nextTick);

    // slugify used for the compareAs value by default, so 'compare' fails
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should not prevent default using the slugify (default) behavior as the compare function when urlify value is equal', async () => {
    const slug = document.querySelector('#id_slug');

    const title = 'the-french-dispatch-a-love-letter-to-journalists';

    slug.setAttribute('value', title);

    // apply the urlify method to the content to ensure the value before check is urlify
    slug.dispatchEvent(new Event('blur'));

    expect(slug.value).toEqual(
      'the-french-dispatch-a-love-letter-to-journalists',
    );

    const event = new CustomEvent('custom:event', { detail: { value: title } });

    event.preventDefault = jest.fn();

    slug.dispatchEvent(event);

    await new Promise(process.nextTick);

    // slugify used for the compareAs value by default, so 'compare' passes with the initial urlify value on blur
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should not prevent default using the urlify behavior as the compare function when urlify value matches', async () => {
    const title = 'Тестовий заголовок';

    const slug = document.querySelector('#id_slug');

    slug.setAttribute('data-w-clean-compare-as-param', 'urlify');
    slug.setAttribute('value', title);

    // apply the urlify method to the content to ensure the value before check is urlify
    slug.dispatchEvent(new Event('blur'));

    await new Promise(process.nextTick);

    expect(slug.value).toEqual('testovij-zagolovok');

    const event = new CustomEvent('custom:event', {
      detail: { compareAs: 'urlify', value: title },
    });

    event.preventDefault = jest.fn();

    slug.dispatchEvent(event);

    await new Promise(process.nextTick);

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should prevent default if the values are not the same', async () => {
    document.querySelector('#id_slug').setAttribute('value', 'title-alpha');

    const event = new CustomEvent('custom:event', {
      detail: { value: 'title beta' },
    });

    event.preventDefault = jest.fn();

    document.getElementById('id_slug').dispatchEvent(event);

    await new Promise(process.nextTick);

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should not prevent default if both values are empty strings', async () => {
    const slugInput = document.querySelector('#id_slug');
    slugInput.setAttribute('value', '');

    const event = new CustomEvent('custom:event', {
      detail: { value: '' },
    });

    event.preventDefault = jest.fn();

    slugInput.dispatchEvent(event);

    await new Promise(process.nextTick);

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should prevent default if the new value is an empty string but the existing value is not', async () => {
    const slugInput = document.querySelector('#id_slug');
    slugInput.setAttribute('value', 'existing-value');

    const event = new CustomEvent('custom:event', {
      detail: { value: '' },
    });

    event.preventDefault = jest.fn();

    slugInput.dispatchEvent(event);

    await new Promise(process.nextTick);

    expect(event.preventDefault).toHaveBeenCalled();
  });
});

describe('urlify behavior', () => {
  let application;

  beforeEach(() => {
    application?.stop();

    document.body.innerHTML = `
      <input
        id="id_slug"
        name="slug"
        type="text"
        data-controller="w-clean"
      />`;

    application = Application.start();
    application.register('w-clean', CleanController);

    const slugInput = document.querySelector('#id_slug');

    slugInput.dataset.action = [
      'blur->w-clean#slugify',
      'custom:event->w-clean#urlify:prevent',
    ].join(' ');
  });

  it('should update slug input value if the values are the same', async () => {
    const slugInput = document.getElementById('id_slug');
    slugInput.value = 'urlify Testing On edit page  ';

    const event = new CustomEvent('custom:event', {
      detail: { value: 'urlify Testing On edit page' },
      bubbles: false,
    });

    document.getElementById('id_slug').dispatchEvent(event);

    await new Promise(process.nextTick);

    expect(slugInput.value).toBe('urlify-testing-on-edit-page');
  });

  it('should transform input with special (unicode) characters to their ASCII equivalent by default', async () => {
    const slugInput = document.getElementById('id_slug');
    slugInput.value = 'Some Title with éçà Spaces';

    const event = new CustomEvent('custom:event', {
      detail: { value: 'Some Title with éçà Spaces' },
    });

    document.getElementById('id_slug').dispatchEvent(event);

    await new Promise(process.nextTick);

    expect(slugInput.value).toBe('some-title-with-eca-spaces');
  });

  it('should transform input with special (unicode) characters to keep unicode values if allow unicode value is truthy', async () => {
    const value = 'Dê-me fatias de   pizza de manhã --ou-- à noite';

    const slugInput = document.getElementById('id_slug');
    slugInput.setAttribute('data-w-clean-allow-unicode-value', 'true');

    slugInput.value = value;

    const event = new CustomEvent('custom:event', { detail: { value } });

    document.getElementById('id_slug').dispatchEvent(event);

    await new Promise(process.nextTick);

    expect(slugInput.value).toBe('dê-me-fatias-de-pizza-de-manhã-ou-à-noite');
  });

  it('should return an empty string when input contains only special characters', async () => {
    const slugInput = document.getElementById('id_slug');
    slugInput.value = '$$!@#$%^&*';

    const event = new CustomEvent('custom:event', {
      detail: { value: '$$!@#$%^&*' },
    });

    document.getElementById('id_slug').dispatchEvent(event);

    await new Promise(process.nextTick);

    expect(slugInput.value).toBe('');
  });
});