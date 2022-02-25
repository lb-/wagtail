import { versionOutOfDate } from '../../utils/version';
import { Controller } from '@hotwired/stimulus';

class UpgradeController extends Controller {
  static identifier = 'upgrade'; // note: this is not a Stimulus thing but could be a convention we set
  static values = { version: String, url: String };
  static targets = ['link', 'version'];

  addWarning({ url, version }) {
    this.linkTarget.setAttribute('href', url);
    this.versionTarget.innerText = version;
    this.element.style.display = '';
  }

  checkVersion() {
    const currentVersion = this.version;
    const releasesUrl = this.urlValue;

    fetch(releasesUrl)
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

  connect() {
    this.checkVersion();
  }
}

export default UpgradeController;
