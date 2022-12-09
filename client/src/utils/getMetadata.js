/* eslint-disable no-underscore-dangle */

let metadata = null;

/**
 * Reads the metadata from the DOM on first call, then returns the object on
 * each subsequent call.
 *
 * @returns {Object}
 */
const getMetadata = () => {
  if (!metadata) {
    metadata = document.querySelector('[data-wagtail-metadata]')._METADATA;
  }

  return metadata;
};

export { getMetadata };
