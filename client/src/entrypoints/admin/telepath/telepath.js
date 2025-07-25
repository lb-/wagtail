/* RemovedInWagtail80Warning: telepath is now initialized in wagtailadmin.js.
 * This endpoint is retained for legacy third-party apps that import this file.
 */

import Telepath from 'telepath-unpack';

// Prevent double-initialisation if imported twice
// This was introduced because both the sidebar and the page editor
// use telepath, but they use separate hooks for JS dependencies so we
// can't de-duplicate the telepath import.
if (!window.telepath) {
  window.telepath = new Telepath();
}
