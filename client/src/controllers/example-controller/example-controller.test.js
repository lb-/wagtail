import { Application } from '@hotwired/stimulus';

import ExampleController from './example-controller';

describe('ExampleController', () => {
  beforeAll(() => {
    const application = Application.start();
    application.register('example', ExampleController);

    document.body.innerHTML = '<h1 data-controller="example" id="example" data-example-name-value="Mr. Rabbit"></h1>';
  });

  it('should exist', () => {
    expect(ExampleController).toBeInstanceOf(Function);
  });

  it('should update the content of the controlled element', () => {
    expect(document.getElementById('example').textContent).toEqual('Hello, Mr. Rabbit!');
    expect(document.getElementById('example')).toMatchSnapshot();
  });
});
