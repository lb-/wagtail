import { Application } from '@hotwired/stimulus';
import { LoaderController } from './LoaderController';

jest.useFakeTimers();
describe('LoaderController', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form>
        <button type="submit"
          class="button button-longrunning"
          data-controller="w-loader"
          data-action="w-loader#activate"
          >
          <svg>...</svg>
          <em data-w-loader-target="label" id="em-el">Sign in</em>
        </button>
      </form>
        `;
    Application.start().register('w-loader', LoaderController);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should not change the text of the button to Loading if the form is not valid', async () => {
    const form = document.querySelector('form');
    const button = document.querySelector('.button-longrunning');

    form.noValidate = false;
    form.checkValidity = jest.fn().mockReturnValue(false);
    const onClick = jest.fn();
    button.addEventListener('click', onClick);
    button.dispatchEvent(new CustomEvent('click'));

    await Promise.resolve(true);

    expect(button.disabled).toEqual(false);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should not run the if statement if the form is  valid', async () => {
    const form = document.querySelector('form');
    const button = document.querySelector('.button-longrunning');

    form.noValidate = true;
    form.checkValidity = jest.fn().mockReturnValue(true);
    const onClick = jest.fn();
    button.addEventListener('click', onClick);
    button.dispatchEvent(new CustomEvent('click'));

    await Promise.resolve(true);

    expect(button.disabled).toEqual(false);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should set timeout', () => {
    const form = document.querySelector('form');
    const button = document.querySelector('.button-longrunning');
    jest.spyOn(global, 'setTimeout');

    button.click();

    expect(setTimeout).toHaveBeenCalledTimes(3);
  });

  it('should change the the text of the button and sets disabled attribute on click', () => {
    const button = document.querySelector('.button-longrunning');
    const label = document.querySelector('#em-el');

    button.click();
    jest.advanceTimersByTime(10);

    expect(label.textContent).toBe('Loading');
    expect(button.getAttribute('disabled')).toBe('');
    expect(button.classList.contains('button-longrunning-active')).toBe(true);

    jest.runAllTimers();

    expect(label.textContent).toBe('Sign in');
    expect(button.getAttribute('disabled')).toBeNull();
    expect(button.classList.contains('button-longrunning-active')).toBe(false);
  });
});
