import { VersionDeltaType, VersionNumber } from '../utils/version';
import { AbstractController } from './AbstractController';

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
    ltsOnly: { default: false, type: Boolean },
    url: { default: 'https://releases.wagtail.org/latest.txt', type: String },
  };

  currentVersionValue: string;
  hiddenClass: string;
  latestVersionTarget: HTMLElement;
  linkTarget: HTMLElement;
  ltsOnlyValue: any;
  urlValue: string;

  connect() {
    this.checkVersion();
  }

  checkVersion() {
    const currentVersion = new VersionNumber(this.currentVersionValue);
    const releasesUrl = this.urlValue;
    const showLTSOnly = this.ltsOnlyValue;

    fetch(releasesUrl, {
      referrerPolicy: 'strict-origin-when-cross-origin',
    })
      .then((response) => {
        if (response.status !== 200) {
          // eslint-disable-next-line no-console
          console.error(
            `Unexpected response from ${releasesUrl}. Status: ${response.status}`,
          );
          return false;
        }
        return response.json();
      })
      .then((payload) => {
        let data = payload;

        if (data && data.lts && showLTSOnly) {
          data = data.lts;
        }

        if (data && data.version) {
          const latestVersion = new VersionNumber(data.version);
          const versionDelta = currentVersion.howMuchBehind(latestVersion);

          let releaseNotesUrl = null;
          if (!versionDelta) {
            return;
          }
          if (
            versionDelta === VersionDeltaType.MAJOR ||
            versionDelta === VersionDeltaType.MINOR
          ) {
            releaseNotesUrl = data.minorUrl;
          } else {
            releaseNotesUrl = data.url;
          }

          this.showWarning({
            url: releaseNotesUrl || '',
            version: [data.version, showLTSOnly ? '(LTS)' : '']
              .join(' ')
              .trim(),
          });
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(`Error fetching ${releasesUrl}. Error: ${err}`);
      });
  }

  showWarning({ url, version }) {
    const element = this.element as HTMLElement;

    this.linkTarget.setAttribute('href', url);
    this.latestVersionTarget.innerText = version;
    element.classList.remove(this.hiddenClass);
  }
}
