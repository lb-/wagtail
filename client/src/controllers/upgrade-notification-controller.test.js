import { Application } from '@hotwired/stimulus';

import UpgradeNotificationController from './upgrade-notification-controller';

// https://stackoverflow.com/a/51045733
const flushPromises = () => new Promise(setImmediate);

describe('UpgradeNotificationController', () => {
  const url = 'https://releases.wagtail.org/mock.txt';
  const version = '2.3';

  document.body.innerHTML = `
  <div
    class="panel w-hidden"
    id="panel"
    data-controller="w-upgrade-notification"
    data-w-upgrade-notification-current-version-value="${version}"
    data-w-upgrade-notification-hidden-class="w-hidden"
    data-w-upgrade-notification-url-value="${url}"
  >
      <div class="help-block help-warning">
          Your version: <strong>${version}</strong>.
          New version: <strong id="latest-version" data-w-upgrade-notification-target="latestVersion"></strong>.
          <a href="" id="link" data-w-upgrade-notification-target="link">Release notes</a>
      </div>
  </div>
  `;

  it('should keep the hidden class by default', async () => {
    const data = {
      version: '5.15.1',
      url: 'https://docs.wagtail.org/latest/url',
      minorUrl: 'https://docs.wagtail.org/latest-minor/url',
      lts: {
        version: '5.12.2',
        url: 'https://docs.wagtail.org/lts/url',
        minorUrl: 'https://docs.wagtail.org/lts-minor/url',
      },
    };

    fetch.mockResponseSuccess(JSON.stringify(data));

    expect(global.fetch).not.toHaveBeenCalled();

    const application = Application.start();

    application.register(
      'w-upgrade-notification',
      UpgradeNotificationController,
    );

    // trigger next browser render cycle
    await Promise.resolve(true);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://releases.wagtail.org/mock.txt',
      { referrerPolicy: 'strict-origin-when-cross-origin' },
    );
    expect(
      document.getElementById('panel').classList.contains('w-hidden'),
    ).toBe(true);

    await flushPromises();

    // should remove the hidden class on success
    expect(
      document.getElementById('panel').classList.contains('w-hidden'),
    ).toBe(false);

    // should update the version in the message
    expect(document.getElementById('latest-version').innerText).toEqual(
      data.version,
    );

    // should update the link
    expect(document.getElementById('link').getAttribute('href')).toEqual(
      data.url,
    );
  });

  it.skip('should not show the message if the current version is up to date', () => {
    const data = {
      version: '2.3',
      url: 'https://docs.wagtail.org/latest/url',
      minorUrl: 'https://docs.wagtail.org/latest-minor/url',
      lts: {
        version: '2.2',
        url: 'https://docs.wagtail.org/lts/url',
        minorUrl: 'https://docs.wagtail.org/lts-minor/url',
      },
    };

    fetch.mockResponseSuccess(JSON.stringify(data));

    expect(global.fetch).not.toHaveBeenCalled();

    const application = Application.start();

    application.register(
      'w-upgrade-notification',
      UpgradeNotificationController,
    );

    expect(
      document.getElementById('panel').classList.contains('w-hidden'),
    ).toBe(true);

    // await flushPromises(); // getting jest error - yield flushPromises(); SyntaxError: Unexpected strict mode reserved word

    expect(global.fetch).toHaveBeenCalledWith(
      'https://releases.wagtail.org/mock.txt',
    );

    // should keep the hidden class on success
    expect(
      document.getElementById('panel').classList.contains('w-hidden'),
    ).toBe(true);

    // should update the version in the message
    expect(document.getElementById('latest-version').innerText).toEqual(
      data.version,
    );

    // should update the link
    expect(document.getElementById('link').getAttribute('href')).toEqual(
      data.url,
    );
  });

  it.skip('should throw an error', () => {});
});
