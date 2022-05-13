import { versionOutOfDate } from '../utils/version';
import AbstractController from './abstract-controller';

/**
 * Used to provide an upgrade notification when the resolved latest version
 * is higher than the currently installed version of Wagtail.
 *
 * Expected JSON payload:
 * {
 *     "version" : "1.2.3",    // Version number. Can only contain numbers and decimal point.
 *     "url" : "https://wagtail.org"  // Absolute URL to page/file containing release notes or actual package. It's up to you.
 * }
 *
 * @example
 * <div
 *   class="hidden"
 *   data-controller="w-upgrade-notification"
 *   data-w-upgrade-notification-current-version-value="1.0"
 *   data-w-upgrade-notification-hidden-class="w-hidden"
 * >
 *  New version available: <span data-w-upgrade-notification-target="latestVersion"></span>
 * </div>
 *
 */
export default class UpgradeNotificationController extends AbstractController {
  static isIncludedInCore = true;
  static classes = ['hidden'];
  static targets = ['latestVersion', 'link'];
  static values = {
    currentVersion: String,
    url: { default: 'https://releases.wagtail.org/latest.txt', type: String },
  };

  currentVersionValue: string;
  hiddenClass: string;
  latestVersionTarget: HTMLElement;
  linkTarget: HTMLElement;
  urlValue: string;

  connect() {
    this.checkVersion();
  }

  addWarning({ url, version }) {
    const element = this.element as HTMLElement;

    this.linkTarget.setAttribute('href', url);
    this.latestVersionTarget.innerText = version;
    element.classList.remove(this.hiddenClass);
  }

  checkVersion() {
    const currentVersion = this.currentVersionValue;
    const releasesUrl = this.urlValue;

    fetch(releasesUrl, {
      referrerPolicy: 'strict-origin-when-cross-origin',
    })
      .then((response) => {
        if (response.status !== 200) {
          const message = `Unexpected response from ${releasesUrl}. Status: ${response.status}`;
          throw new Error(message);
        }
        return response.json();
      })
      .then((data) => {
        if (
          data &&
          data.version &&
          versionOutOfDate(data.version, currentVersion)
        ) {
          this.addWarning(data);
        }
      })
      .catch((err) => {
        const message = `Error fetching ${releasesUrl}. Error: ${err}`;
        throw new Error(message);
      });
  }
}
