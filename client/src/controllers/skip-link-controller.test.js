import { Application } from '@hotwired/stimulus';

import SkipLinkController from './skip-link-controller';

describe('SkipLinkController', () => {
  document.body.innerHTML = `
  <div>
    <a id="test" data-controller="w-skip-link" data-action="w-skip-link#skipToContent">Skip</a>
  </div>
  <main id="main">
    CONTENT
  </main>
  <button id="other">other</button>
  `;

  const application = Application.start();

  application.register('w-skip-link', SkipLinkController);

  it('should update focus on the main element by default when the link is clicked', () => {
    const mainElement = document.getElementById('main');

    expect(document.activeElement).toBe(document.body);
    expect(mainElement.getAttribute('tabindex')).toEqual(null);

    document.getElementById('test').click();

    expect(mainElement.getAttribute('tabindex')).toEqual('-1');
    expect(document.activeElement).toEqual(mainElement);

    // move focus out & expect tabindex to reset
    const otherButton = document.getElementById('other');
    otherButton.focus();
    expect(document.activeElement).toEqual(otherButton);
    expect(mainElement.getAttribute('tabindex')).toEqual(null);
  });
});
