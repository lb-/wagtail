import { Application } from '@hotwired/stimulus';
import { SearchController } from './SearchController';
import { range } from '../utils/range';

jest.useFakeTimers();

jest.spyOn(console, 'error').mockImplementation(() => {});

const flushPromises = () => new Promise(setImmediate);

describe('SearchController', () => {
  let application;
  let handleError;

  const getMockResults = (
    { attrs = ['id="new-results"'], total = 3 } = {},
    arr = range(0, total),
  ) => {
    const items = arr.map((_) => `<li>RESULT ${_}</li>`).join('');
    return `<ul ${attrs.join(' ')}>${items}</ul>`;
  };

  beforeEach(() => {
    application = Application.start();
    application.register('w-search', SearchController);
    handleError = jest.fn();
    application.handleError = handleError;
  });

  afterEach(() => {
    application.stop();
    document.body.innerHTML = '<main></main>';
    jest.clearAllMocks();

    if (window.headerSearch) {
      delete window.headerSearch;
    }
  });

  describe('when results element & src URL value is not available', () => {
    it('should throw an error if no valid selector can be resolved', async () => {
      expect(handleError).not.toHaveBeenCalled();

      document.body.innerHTML = `
      <div id="results"></div>
      <input
        id="search"
        type="text"
        name="q"
        data-controller="w-search"
        data-w-search-target-value=""
      />`;

      // trigger next browser render cycle
      await Promise.resolve();

      expect(handleError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "'' is not a valid selector" }),
        'Error connecting controller',
        expect.objectContaining({ identifier: 'w-search' }),
      );
    });

    it('should throw an error if target element selector cannot resolve a DOM element', async () => {
      expect(handleError).not.toHaveBeenCalled();

      document.body.innerHTML = `
      <div id="results"></div>
      <input
        id="search"
        type="text"
        name="q"
        data-controller="w-search"
        data-w-search-src-value="path/to/search"
        data-w-search-target-value="#resultX"
      />`;

      // trigger next browser render cycle
      await Promise.resolve();

      expect(handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Cannot find valid target element at "#resultX"',
        }),
        'Error connecting controller',
        expect.objectContaining({ identifier: 'w-search' }),
      );
    });

    it('should throw an error if no valid src URL can be resolved', async () => {
      expect(handleError).not.toHaveBeenCalled();

      document.body.innerHTML = `
      <div id="results"></div>
      <input
        id="search"
        type="text"
        name="q"
        data-controller="w-search"
        data-w-search-target-value="#results"
      />`;

      // trigger next browser render cycle
      await Promise.resolve();

      expect(handleError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Cannot find valid src URL value' }),
        'Error connecting controller',
        expect.objectContaining({ identifier: 'w-search' }),
      );
    });
  });

  describe('fallback on window.headerSearch values if not in HTML', () => {
    it('should set the src & target value from the window.headerSearch if not present', async () => {
      window.headerSearch = {
        url: 'path/to/page/search',
        targetOutput: '#page-results',
      };

      document.body.innerHTML = `
      <div id="page-results"></div>
      <input
        id="search"
        type="text"
        name="q"
        data-controller="w-search"
      />`;

      // trigger next browser render cycle
      await Promise.resolve();

      // should not error
      expect(handleError).not.toHaveBeenCalled();

      expect({ ...document.getElementById('search').dataset }).toEqual({
        controller: 'w-search',
        wSearchIconValue: '',
        wSearchLoadingValue: 'false', // set on connect
        wSearchSrcValue: 'path/to/page/search', // set from window.headerSearch
        wSearchTargetValue: '#page-results', // set from window.headerSearch
      });
    });
  });

  describe('performing a search via actions on a controlled input', () => {
    beforeEach(() => {
      document.body.innerHTML = `
      <form class="search-form" action="/admin/images/" method="get" role="search">
        <div class="w-field__input">
          <svg class="icon icon-search" aria-hidden="true"><use href="#icon-search"></use></svg>
          <input
            id="search"
            type="text"
            name="q"
            data-controller="w-search"
            data-action="keyup->w-search#update"
            data-w-search-src-value="/admin/images/results/"
            data-w-search-target-value="#results"
          />
        </div>
      </form>
      <div id="results"></div>
      `;

      window.history.replaceState(null, '', '?');
    });

    it('should not do a search if the URL query and the input query are equal', () => {
      const input = document.getElementById('search');

      // when values are empty
      input.dispatchEvent(new CustomEvent('keyup', { bubbles: true }));
      jest.runAllTimers(); // search is debounced
      expect(handleError).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();

      // when input value only has whitespace
      input.value = '   ';
      input.dispatchEvent(new CustomEvent('keyup', { bubbles: true }));
      jest.runAllTimers(); // search is debounced
      expect(handleError).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();

      // when input value and URL query only have whitespace
      window.history.replaceState(null, '', '?q=%20%20&p=foo'); // 2 spaces
      input.value = '    '; // 4 spaces
      input.dispatchEvent(new CustomEvent('keyup', { bubbles: true }));
      jest.runAllTimers(); // search is debounced
      expect(handleError).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();

      // when input value and URL query have the same value
      window.history.replaceState(null, '', '?q=espresso');
      input.value = 'espresso';
      input.dispatchEvent(new CustomEvent('keyup', { bubbles: true }));
      jest.runAllTimers(); // search is debounced
      expect(handleError).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();

      // when input value and URL query have the same value (ignoring whitespace)
      window.history.replaceState(null, '', '?q=%20espresso%20');
      input.value = '  espresso ';
      input.dispatchEvent(new CustomEvent('keyup', { bubbles: true }));
      jest.runAllTimers(); // search is debounced
      expect(handleError).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should allow for searching via a declared action on input changes', async () => {
      const input = document.getElementById('search');
      const icon = document.querySelector('.icon-search use');

      const results = getMockResults();

      const onSuccess = new Promise((resolve) => {
        document.addEventListener('w-search:success', resolve);
      });

      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(results),
        }),
      );

      expect(window.location.search).toEqual('');
      expect(handleError).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
      expect(icon.getAttribute('href')).toEqual('#icon-search');

      input.value = 'alpha';
      input.dispatchEvent(new CustomEvent('keyup', { bubbles: true }));

      jest.runAllTimers(); // search is debounced

      // visual loading state should be active
      await Promise.resolve(); // trigger next rendering
      expect(icon.getAttribute('href')).toEqual('#icon-spinner');

      expect(handleError).not.toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        '/admin/images/results/?q=alpha',
        expect.any(Object),
      );

      const successEvent = await onSuccess;

      // should dispatch success event
      expect(successEvent.detail).toEqual({ results });

      // should update HTML
      expect(
        document.getElementById('results').querySelectorAll('li'),
      ).toHaveLength(3);

      await flushPromises();

      // should update the current URL
      expect(window.location.search).toEqual('?q=alpha');

      // should reset the icon
      expect(icon.getAttribute('href')).toEqual('#icon-search');
    });

    it('should correctly clear any params based on the action param value', async () => {
      const MOCK_SEARCH = '?k=keep&q=alpha&r=remove-me&s=stay&x=exclude-me';
      window.history.replaceState(null, '', MOCK_SEARCH);
      const input = document.getElementById('search');

      // update clear param - check we can handle space separated values
      input.setAttribute('data-w-search-clear-param', 'r x');

      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(getMockResults()),
        }),
      );

      expect(window.location.search).toEqual(MOCK_SEARCH);

      input.value = 'beta';
      input.dispatchEvent(new CustomEvent('keyup', { bubbles: true }));

      // run all timers & promises
      await flushPromises(jest.runAllTimers());

      // should update the current URL
      expect(window.location.search).toEqual('?k=keep&q=beta&s=stay');
    });

    it('should handle both clearing values in the URL and using a custom query param from input', async () => {
      const MOCK_SEARCH = '?k=keep&query=alpha&r=remove-me';
      window.history.replaceState(null, '', MOCK_SEARCH);
      const input = document.getElementById('search');
      input.setAttribute('name', 'query');

      // update clear param value to a single (non-default) value
      input.setAttribute('data-w-search-clear-param', 'r');

      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(getMockResults()),
        }),
      );

      expect(window.location.search).toEqual(MOCK_SEARCH);

      input.value = 'a new search string!';
      input.dispatchEvent(new CustomEvent('keyup', { bubbles: true }));

      // run all timers & promises
      await flushPromises(jest.runAllTimers());

      // should update the current URL, removing any cleared params
      expect(window.location.search).toEqual(
        '?k=keep&query=a+new+search+string%21',
      );
    });

    it('should handle repeated input and correctly resolve the requested data', async () => {
      window.history.replaceState(null, '', '?q=first&p=3');

      const input = document.getElementById('search');

      const onSuccess = new Promise((resolve) => {
        document.addEventListener('w-search:success', resolve);
      });

      const delays = [200, 20, 400]; // emulate changing results timings

      fetch.mockImplementation(
        (query) =>
          new Promise((resolve) => {
            const delay = delays.pop();
            setTimeout(() => {
              resolve({
                ok: true,
                status: 200,
                text: () =>
                  Promise.resolve(
                    getMockResults({
                      attrs: [
                        'id="new-results"',
                        `data-query="${query}"`,
                        `data-delay="${delay}"`,
                      ],
                    }),
                  ),
              });
            }, delay);
          }),
      );

      expect(handleError).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();

      input.value = 'alpha';
      input.dispatchEvent(new CustomEvent('keyup', { bubbles: true }));

      setTimeout(() => {
        input.value = 'beta';
        input.dispatchEvent(new CustomEvent('keyup', { bubbles: true }));
      }, 210);

      setTimeout(() => {
        input.value = 'delta';
        input.dispatchEvent(new CustomEvent('keyup', { bubbles: true }));
      }, 420);

      jest.runAllTimers(); // search is debounced

      expect(handleError).not.toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenLastCalledWith(
        '/admin/images/results/?q=delta',
        expect.any(Object),
      );

      const successEvent = await onSuccess;

      // should dispatch success event
      expect(successEvent.detail).toEqual({ results: expect.any(String) });

      // should update HTML
      const resultsElement = document.getElementById('results');
      expect(resultsElement.querySelectorAll('li')).toHaveLength(3);
      expect(
        resultsElement.querySelector('[data-query]').dataset.query,
      ).toEqual('/admin/images/results/?q=delta');

      await flushPromises();

      // should update the current URL & clear the page param
      expect(window.location.search).toEqual('?q=delta');
    });

    it('should handle search results API failures gracefully', async () => {
      const icon = document.querySelector('.icon-search use');
      const input = document.getElementById('search');

      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        }),
      );

      expect(window.location.search).toEqual('');
      expect(handleError).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();

      input.value = 'alpha';
      input.dispatchEvent(new CustomEvent('keyup', { bubbles: true }));

      jest.runAllTimers(); // search is debounced

      expect(handleError).not.toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        '/admin/images/results/?q=alpha',
        expect.any(Object),
      );

      await Promise.resolve(); // trigger next rendering
      expect(icon.getAttribute('href')).toEqual('#icon-spinner');

      await flushPromises(); // resolve all promises

      // eslint-disable-next-line no-console
      expect(console.error).toHaveBeenLastCalledWith(
        'Error fetching /admin/images/results/?q=alpha',
        expect.any(Error),
      );

      // should not update any HTML
      expect(document.getElementById('results').innerHTML).toEqual('');
      // should reset the icon

      await Promise.resolve(); // trigger next rendering
      expect(icon.getAttribute('href')).toEqual('#icon-search');
    });
  });

  describe('performing a search via actions on a controlled form', () => {
    beforeEach(() => {
      document.body.innerHTML = `
      <form
        class="search-form"
        action="/path/to/form/action/"
        method="get"
        role="search"
        data-controller="w-search"
        data-action="input->w-search#update"
        data-w-search-target-value="#other-results"
      >
        <div class="w-field__input">
          <svg class="icon icon-search" aria-hidden="true"><use href="#icon-search"></use></svg>
          <input id="search" type="text" name="q" data-w-search-target="input"/>
        </div>
      </form>
      <div id="other-results"></div>
      `;

      window.history.replaceState(null, '', '?');
    });

    it('should allow for searching via a declared action on input changes', async () => {
      const input = document.getElementById('search');
      const icon = document.querySelector('.icon-search use');

      const results = getMockResults();

      const onSuccess = new Promise((resolve) => {
        document.addEventListener('w-search:success', resolve);
      });

      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(results),
        }),
      );

      expect(window.location.search).toEqual('');
      expect(handleError).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
      expect(icon.getAttribute('href')).toEqual('#icon-search');

      input.value = 'alpha';
      input.dispatchEvent(new CustomEvent('input', { bubbles: true }));

      jest.runAllTimers(); // search is debounced

      // visual loading state should be active
      await Promise.resolve(); // trigger next rendering
      expect(icon.getAttribute('href')).toEqual('#icon-spinner');

      expect(handleError).not.toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        '/path/to/form/action/?q=alpha',
        expect.any(Object),
      );

      const successEvent = await onSuccess;

      // should dispatch success event
      expect(successEvent.detail).toEqual({ results });

      // should update HTML
      expect(
        document.getElementById('other-results').querySelectorAll('li'),
      ).toHaveLength(3);

      await flushPromises();

      // should update the current URL
      expect(window.location.search).toEqual('?q=alpha');

      // should reset the icon
      expect(icon.getAttribute('href')).toEqual('#icon-search');
    });
  });
});
