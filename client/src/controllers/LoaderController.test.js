import { Application } from '@hotwired/stimulus';
import { LoaderController } from './LoaderController';

jest.useFakeTimers();

const flushPromises = () => new Promise(setImmediate);

describe('LoaderController', () => {
  // form submit is not implemented in jsdom
  const mockSubmit = jest.fn((e) => e.preventDefault());

  beforeEach(() => {
    document.body.innerHTML = `
  <form id="form">
    <button
      id="button"
      type="submit"
      class="button button-longrunning"
      data-controller="w-loader"
      data-action="w-loader#activate"
    >
      <svg>...</svg>
      <em data-w-loader-target="label" id="em-el">Sign in</em>
    </button>
  </form>`;

    document.getElementById('form').addEventListener('submit', mockSubmit);

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
    expect(mockSubmit).not.toHaveBeenCalled();

    form.noValidate = false;
    form.checkValidity = jest.fn().mockReturnValue(false);
    const onClick = jest.fn();
    button.addEventListener('click', onClick);
    button.dispatchEvent(new CustomEvent('click'));

    jest.advanceTimersByTime(10);
    await flushPromises();

    expect(mockSubmit).not.toHaveBeenCalled();
    expect(button.disabled).toEqual(false);
    expect(onClick).toHaveBeenCalledTimes(1);

    jest.runAllTimers();
    await flushPromises();

    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it.skip('should not run the if statement if the form is valid', async () => {
    // not sure what this test is really testing - maybe not needed?

    const form = document.querySelector('form');
    const button = document.querySelector('.button-longrunning');
    expect(mockSubmit).not.toHaveBeenCalled();

    form.noValidate = true;
    form.checkValidity = jest.fn().mockReturnValue(true);
    const onClick = jest.fn();
    button.addEventListener('click', onClick);
    button.dispatchEvent(new CustomEvent('click'));

    await Promise.resolve(true);

    expect(mockSubmit).not.toHaveBeenCalled();
    expect(button.disabled).toEqual(false);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should trigger a timeout based on the value attribute', async () => {
    const button = document.querySelector('.button-longrunning');

    button.click();
    jest.runAllTimers();

    // default timer 30 seconds
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 30_000);

    // change to 4 seconds
    document
      .getElementById('button')
      .setAttribute('data-w-loader-duration-seconds-value', '4');

    button.click();
    jest.runAllTimers();

    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 4_000);
  });

  it('should change the the text of the button and sets disabled attribute on click', async () => {
    const button = document.querySelector('.button-longrunning');
    const label = document.querySelector('#em-el');
    expect(mockSubmit).not.toHaveBeenCalled();

    button.click();

    jest.advanceTimersByTime(10);
    await flushPromises();

    expect(label.textContent).toBe('Loading');
    expect(button.getAttribute('disabled')).toEqual('');
    expect(button.classList.contains('button-longrunning-active')).toBe(true);

    jest.runAllTimers();
    await flushPromises();

    expect(mockSubmit).toHaveBeenCalled();
    expect(label.textContent).toBe('Sign in');
    expect(button.getAttribute('disabled')).toBeNull();
    expect(button.classList.contains('button-longrunning-active')).toBe(false);
  });
});
