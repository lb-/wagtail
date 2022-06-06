import { Application } from '@hotwired/stimulus';

import { SearchController } from './SearchController';

jest.useFakeTimers();

function currentEventLoopEnd() {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

describe('SearchController', () => {
  document.body.innerHTML = `
     <form
       action="/index.html"
       id="form"
       method="get"
       role="search"
       data-controller="w-search"
       data-w-search-animate-in-class="w-animate-fade-in"
       data-w-search-processing-class="w-animate-pulse"
       data-w-search-results-selector-value="#results"
      ><div class="input" id="input-container">
        <input
          type="text"
          name="q"
          data-w-search-target="termInput"
          data-action="keyup->w-search#search"
          id="id_q">
        </div>
      </form>
      <div id="results"></div>
    `;

  const application = Application.start();

  application.register('w-search', SearchController);

  it('should debounce the search action & add results', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            '<li id="new-results">RESULT 1</li><li id="new-results">RESULT 2</li>',
          ),
      }),
    );

    expect(global.fetch).not.toHaveBeenCalled();

    document.getElementById('id_q').dispatchEvent(new CustomEvent('keyup'));
    document.getElementById('id_q').value = 'items';

    expect(global.fetch).not.toHaveBeenCalled();

    jest.runAllTimers();

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost/index.html?q=items',
      { headers: { 'x-requested-with': 'XMLHttpRequest' } },
    );
    expect(
      document.getElementById('input-container').classList.toString(),
    ).toEqual('input w-animate-pulse');
    expect(document.getElementById('results').classList.toString()).toEqual('');
    expect(document.getElementById('results').childNodes).toHaveLength(0);

    await currentEventLoopEnd();

    expect(
      document.getElementById('input-container').classList.toString(),
    ).toEqual('input');
    expect(document.getElementById('results').classList.toString()).toEqual(
      'w-animate-fade-in',
    );
    expect(document.getElementById('results').childNodes).toHaveLength(2);
  });
});
