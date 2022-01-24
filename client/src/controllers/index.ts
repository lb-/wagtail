/**
 * Any files in the format some-controller.ts within this folder will be prepared
 * as a definition array for Stimulus.
 *
 * The controller's name will be used to generate the Controller's identifier
 * e.g. `UpgradeController` -> `w-upgrade`
 * e.g. `SomeOtherSuperController` -> `w-some-other-super`
 */
import { Definition } from '@hotwired/stimulus';

import { AbstractControllerConstructor } from './AbstractController';
import getKebabCaseIdentifier from '../utils/get-kebab-case-identifier';

const context = require.context('./', false, /[A-Za-z]*Controller\.ts$/);

interface ECMAScriptModule {
  __esModule: boolean;
  default?: AbstractControllerConstructor;
}

/**
 * Return the default module, if exported, otherwise find the first function
 * (remember classes are functions) that exist as a named export.
 */
const getConstructor = (module: ECMAScriptModule) =>
  module.default ||
  Object.values(module).find((value) => typeof value === 'function');

/**
 * Parses the imported context to output an array of controller / identifier definitions.
 * Prepares the identifier based on the file name (remember classes may be renamed by
 * minifier).
 */
const controllerDefinitions: Definition[] = context
  .keys()
  .map((key) => ({
    controllerConstructor: getConstructor(context(key)),
    identifier: getKebabCaseIdentifier(
      (key.match(/^(?:\.\/)?(\w+)(?:Controller)\..+?$/) || [])[1],
    ),
  }))
  .filter(
    (item): item is Definition =>
      item?.controllerConstructor?.isIncludedInCore && item?.identifier,
  );

export default controllerDefinitions;
