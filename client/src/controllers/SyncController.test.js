import { Application } from '@hotwired/stimulus';
import { SyncController } from './SyncController';

import { range } from '../utils/range';

jest.useFakeTimers();

describe('SyncController', () => {
  let application;

  describe('basic sync to a target field', () => {
    beforeEach(() => {
      application?.stop();

      document.body.innerHTML = `
      <section>
        <input type="text" name="title" id="title" />
        <input
          type="date"
          id="event-date"
          name="event-date"
          value="2025-07-22"
          data-controller="w-sync"
          data-action="change->w-sync#apply keyup->w-sync#apply cut->w-sync#clear custom:event->w-sync#ping"
          data-w-sync-target-value="#title"
        />
      </section>`;

      application = Application.start();
    });

    afterEach(() => {
      document.body.innerHTML = '';
      jest.clearAllMocks();
      jest.clearAllTimers();
    });

    it('should dispatch a start event on targeted element', () => {
      const startListener = jest.fn();
      document
        .getElementById('title')
        .addEventListener('w-sync:start', startListener);

      expect(startListener).not.toHaveBeenCalled();

      application.register('w-sync', SyncController);

      expect(startListener).toHaveBeenCalledTimes(1);

      expect(startListener.mock.calls[0][0].detail).toEqual({
        element: document.getElementById('event-date'),
        value: '2025-07-22',
      });
    });

    it('should allow the sync field to apply its value to the target element', async () => {
      const changeListener = jest.fn();
      document
        .getElementById('title')
        .addEventListener('change', changeListener);

      expect(document.getElementById('title').value).toEqual('');
      expect(changeListener).not.toHaveBeenCalled();

      application.register('w-sync', SyncController);

      const dateInput = document.getElementById('event-date');

      dateInput.value = '2025-05-05';
      dateInput.dispatchEvent(new Event('change'));

      await Promise.resolve(jest.runAllTimers());

      expect(document.getElementById('title').value).toEqual('2025-05-05');
      expect(changeListener).toHaveBeenCalledTimes(1);
    });

    it('should allow for a simple ping against the target field that bubbles', async () => {
      const pingListener = jest.fn();
      document.addEventListener('w-sync:ping', pingListener);

      expect(pingListener).not.toHaveBeenCalled();

      application.register('w-sync', SyncController);

      const dateInput = document.getElementById('event-date');

      dateInput.dispatchEvent(new CustomEvent('custom:event'));

      expect(pingListener).toHaveBeenCalledTimes(1);
      const event = pingListener.mock.calls[0][0];

      expect(event.target).toEqual(document.getElementById('title'));

      expect(event.detail).toEqual({
        element: document.getElementById('event-date'),
        value: '2025-07-22',
      });
    });

    it('should allow the sync field to clear the value of the target element', () => {
      const changeListener = jest.fn();
      document
        .getElementById('title')
        .addEventListener('change', changeListener);

      const titleElement = document.getElementById('title');
      titleElement.setAttribute('value', 'initial title');
      expect(changeListener).not.toHaveBeenCalled();

      application.register('w-sync', SyncController);

      const dateInput = document.getElementById('event-date');

      dateInput.dispatchEvent(new Event('cut'));

      jest.runAllTimers();

      expect(document.getElementById('title').value).toEqual('');
      expect(changeListener).toHaveBeenCalledTimes(1);
    });

    it('should allow for no change events to be dispatched', () => {
      const dateInput = document.getElementById('event-date');
      dateInput.setAttribute('data-w-sync-quiet-value', 'true');

      application.register('w-sync', SyncController);

      dateInput.value = '2025-05-05';
      dateInput.dispatchEvent(new Event('change'));

      expect(dateInput.getAttribute('data-w-sync-quiet-value')).toBeTruthy();
      expect(document.getElementById('title').value).toEqual('');

      dateInput.value = '2025-05-05';
      dateInput.dispatchEvent(new Event('cut'));

      expect(document.getElementById('title').value).toEqual('');
    });

    it('should debounce multiple consecutive calls to apply by default', async () => {
      const titleInput = document.getElementById('title');
      const dateInput = document.getElementById('event-date');

      const changeListener = jest.fn();

      titleInput.addEventListener('change', changeListener);

      dateInput.value = '2027-10-14';

      application.register('w-sync', SyncController);

      range(0, 8).forEach(() => {
        dateInput.dispatchEvent(new Event('keyup'));
        jest.advanceTimersByTime(5);
      });

      expect(changeListener).not.toHaveBeenCalled();
      expect(titleInput.value).toEqual('');

      jest.advanceTimersByTime(50); // not yet reaching the 100ms debounce value

      expect(changeListener).not.toHaveBeenCalled();
      expect(titleInput.value).toEqual('');

      await Promise.resolve(jest.advanceTimersByTime(50)); // pass the 100ms debounce value

      // keyup run multiple times, only one change event should occur
      expect(titleInput.value).toEqual('2027-10-14');
      expect(changeListener).toHaveBeenCalledTimes(1);

      // adjust the delay via a data attribute
      dateInput.setAttribute('data-w-sync-delay-value', '500');

      range(0, 8).forEach(() => {
        dateInput.dispatchEvent(new Event('keyup'));
        jest.advanceTimersByTime(5);
      });

      await await Promise.resolve(jest.advanceTimersByTime(300)); // not yet reaching the custom debounce value
      expect(changeListener).toHaveBeenCalledTimes(1);

      await await Promise.resolve(jest.advanceTimersByTime(295)); // passing the custom debounce value
      expect(changeListener).toHaveBeenCalledTimes(2);
    });
  });

  describe('delayed sync to a target field', () => {
    beforeEach(() => {
      application?.stop();

      document.body.innerHTML = `
      <section>
        <input type="text" name="title" id="title" />
        <input
          type="date"
          id="event-date"
          name="event-date"
          value="2025-07-22"
          data-controller="w-sync"
          data-action="change->w-sync#apply cut->w-sync#clear"
          data-w-sync-target-value="#title"
          data-w-sync-delay-value="500"
        />
      </section>`;

      application = Application.start();
    });

    it('should delay the update on change based on the set value', async () => {
      application.register('w-sync', SyncController);

      const dateInput = document.getElementById('event-date');
      dateInput.value = '2025-05-05';

      dateInput.dispatchEvent(new Event('cut'));

      await Promise.resolve(jest.advanceTimersByTime(500));

      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 500);

      await Promise.resolve(jest.runAllTimers());

      expect(document.getElementById('title').value).toEqual('');
    });

    it('should delay the update on apply based on the set value', async () => {
      const changeListener = jest.fn();
      document
        .getElementById('title')
        .addEventListener('change', changeListener);

      expect(document.getElementById('title').value).toEqual('');
      expect(changeListener).not.toHaveBeenCalled();

      application.register('w-sync', SyncController);

      const dateInput = document.getElementById('event-date');

      dateInput.value = '2025-05-05';
      dateInput.dispatchEvent(new Event('change'));

      await Promise.resolve(jest.advanceTimersByTime(500));

      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 500);

      await Promise.resolve(jest.runAllTimers());

      expect(document.getElementById('title').value).toEqual('2025-05-05');
      expect(changeListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('ability for the sync to be disabled between a target field', () => {
    beforeEach(() => {
      application?.stop();

      document.body.innerHTML = `
      <section>
        <input type="text" name="title" id="title" value="keep me"/>
        <input
          type="date"
          id="event-date"
          name="event-date"
          value="2025-07-22"
          data-controller="w-sync"
          data-action="change->w-sync#apply cut->w-sync#clear focus->w-sync#check"
          data-w-sync-target-value="#title"
        />
      </section>`;

      application = Application.start();
    });

    it('should allow for the target element to block syncing at the start', () => {
      const titleElement = document.getElementById('title');

      expect(titleElement.value).toEqual('keep me');

      titleElement.addEventListener('w-sync:start', (event) => {
        event.preventDefault();
      });

      application.register('w-sync', SyncController);

      const dateInput = document.getElementById('event-date');

      dateInput.value = '2025-05-05';
      dateInput.dispatchEvent(new Event('change'));

      jest.runAllTimers();

      expect(titleElement.value).toEqual('keep me');
      expect(
        dateInput.getAttribute('data-w-sync-block-target-value'),
      ).toBeTruthy();
    });

    it('should allow for the target element to block syncing with the check approach', () => {
      const titleElement = document.getElementById('title');

      expect(titleElement.value).toEqual('keep me');

      titleElement.addEventListener('w-sync:check', (event) => {
        event.preventDefault();
      });

      application.register('w-sync', SyncController);

      const dateInput = document.getElementById('event-date');
      dateInput.setAttribute('data-w-sync-block-target-value', '');

      dateInput.value = '2025-05-05';

      dateInput.dispatchEvent(new Event('focus'));
      dateInput.dispatchEvent(new Event('cut'));

      jest.runAllTimers();

      expect(titleElement.value).toEqual('keep me');
      expect(
        dateInput.getAttribute('data-w-sync-block-target-value'),
      ).toBeTruthy();
    });
  });

  describe('ability to use sync for non-text target fields', () => {
    beforeEach(() => {
      application?.stop();
    });

    it('should allow the sync clear method to be used on a button to clear target fields', async () => {
      document.body.innerHTML = `
      <section>
        <input type="text" name="title" id="title" value="a title field"/>
        <button
          type="button"
          id="clear"
          data-controller="w-sync"
          data-action="w-sync#clear"
          data-w-sync-target-value="#title"
        >Clear</button>
      </section>`;

      application = Application.start();

      application.register('w-sync', SyncController);

      await Promise.resolve();

      expect(document.getElementById('title').value).toEqual('a title field');

      document.getElementById('clear').click();

      expect(document.getElementById('title').innerHTML).toEqual('');
    });

    it('should allow the sync apply method to accept a param instead of the element value', async () => {
      document.body.innerHTML = `
      <section>
        <select name="pets" id="pet-select">
          <option value="dog">Dog</option>
          <option value="cat">Cat</option>
          <option value="pikachu">Pikachu</option>
          <option value="goldfish">Goldfish</option>
        </select>
        <button
          type="button"
          id="choose"
          data-controller="w-sync"
          data-action="w-sync#apply"
          data-w-sync-apply-param="pikachu"
          data-w-sync-target-value="#pet-select"
        >Choose Pikachu</button>
      </section>`;

      application = Application.start();

      application.register('w-sync', SyncController);

      await Promise.resolve();

      expect(document.getElementById('pet-select').value).toEqual('dog');

      document.getElementById('choose').dispatchEvent(new Event('click'));

      await Promise.resolve(jest.runAllTimers());

      expect(document.getElementById('pet-select').value).toEqual('pikachu');
    });
  });

  describe('basic sync from a source field', () => {
    beforeEach(() => {
      application?.stop();

      document.body.innerHTML = `
      <section>
        <input
          type="text"
          name="title"
          id="title"
          data-controller="w-sync"
          data-action="w-sync:connected->w-sync#adopt change@document->w-sync#adopt"
          data-w-sync-join-param=", "
          data-w-sync-source-value="#last-name, #first-name"
        />
        <input type="number" name="number" id="number" value="3" />
        <input type="text" name="first-name" id="first-name" value="Jack" />
        <input type="text" name="last-name" id="last-name" value="Ryan" />
      </section>`;

      application = new Application();
      application.register('w-sync', SyncController);
    });

    afterEach(() => {
      document.body.innerHTML = '';
      jest.clearAllTimers();
      jest.clearAllMocks();
    });

    it('should sync with source fields once the controller connects via the connected event', async () => {
      const titleElement = document.getElementById('title');
      expect(titleElement.value).toEqual('');

      const changeListener = jest.fn();
      document.addEventListener('change', changeListener);

      await application.start().then(jest.runAllTimers);

      expect(titleElement.value).toEqual('Ryan, Jack');

      // should dispatch a change event, by default, on the controlled field
      expect(changeListener).toHaveBeenCalledTimes(1);
      expect(changeListener).toHaveBeenLastCalledWith(
        expect.objectContaining({ target: titleElement }),
      );
    });

    it('should allow for a delay value to sync with a delay', async () => {
      expect(document.getElementById('title').value).toEqual('');
      document
        .getElementById('title')
        .setAttribute('data-w-sync-delay-value', '100');

      await application.start().then(jest.advanceTimersByTime(101)); // debounce value

      expect(document.getElementById('title').value).not.toEqual('Ryan, Jack');

      await Promise.resolve(jest.advanceTimersByTime(201)); // wait for additional delay

      expect(document.getElementById('title').value).toEqual('Ryan, Jack');
    });

    it('should sync with the source fields whenever they change, but not when other fields change', async () => {
      const titleElement = document.getElementById('title');
      const firstNameElement = document.getElementById('first-name');

      // start the application & confirm initial sync has worked
      await application.start().then(jest.runAllTimers);
      expect(titleElement.value).toEqual('Ryan, Jack');

      // change one of the source fields but trigger an event on a different field
      firstNameElement.value = 'John';
      document
        .getElementById('number')
        .dispatchEvent(new Event('change', { bubbles: true }));

      jest.runAllTimers();
      await Promise.resolve(jest.runAllTimers());

      // confirm that the controlled field has not changed as the event was not on the tracked source fields
      expect(firstNameElement.value).toEqual('John');
      expect(titleElement.value).toEqual('Ryan, Jack');

      // trigger on a source field and confirm that the sync has now happened
      firstNameElement.dispatchEvent(new Event('change', { bubbles: true }));
      await Promise.resolve(jest.runAllTimers());

      expect(firstNameElement.value).toEqual('John');
      expect(titleElement.value).toEqual('Ryan, John');
    });

    it('should allow a quiet mode which will not trigger change events on the controlled field', async () => {
      const titleElement = document.getElementById('title');
      titleElement.setAttribute('data-w-sync-quiet-value', 'true');
      expect(titleElement.value).toEqual('');

      const changeListener = jest.fn();
      document.addEventListener('change', changeListener);

      await application.start().then(jest.runAllTimers);

      expect(titleElement.value).toEqual('Ryan, Jack');
      expect(changeListener).not.toHaveBeenCalled();
    });
  });
});
