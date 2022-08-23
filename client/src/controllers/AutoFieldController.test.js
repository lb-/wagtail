import { Application } from '@hotwired/stimulus';

import { AutoFieldController } from './AutoFieldController';

describe('AutoFieldController', () => {
  const submit = jest.fn();

  beforeAll(() => {
    window.HTMLFormElement.prototype.submit = submit;

    document.body.innerHTML = `
  <form>
    <select name="order" data-controller="w-auto-field" data-action="change->w-auto-field#submit" value="A-Z">
      <option value="A-Z" selected>A to Z</option>
      <option value="Z-A">Z to A</option> 
    </select>
  </form>
  `;

    Application.start().register('w-auto-field', AutoFieldController);
  });

  it('should expose a submit method that can be attached to an action', () => {
    expect(submit).not.toHaveBeenCalled();

    const select = document.querySelector('select');
    select.value = 'Z-A';
    select.dispatchEvent(new CustomEvent('change'));

    expect(submit).toHaveBeenCalled();
  });
});
