/**
 * Any files in the format some-controller.ts within this folder will be prepared
 * as a definition array for Stimulus.
 *
 * The controller's name will be used to generate the Controller's identifier
 * e.g. `UpgradeController` -> `w-upgrade`
 * e.g. `SomeOtherSuperController` -> `w-some-other-super`
 */
import { Definition } from '@hotwired/stimulus';

import { AbstractControllerConstructor } from './abstract-controller';
import getKebabCaseIdentifier from '../utils/get-kebab-case-identifier';

const context = require.context('./', false, /[a-z-]*-controller\.ts$/);

interface ECMAScriptModule {
  __esModule: boolean;
  default?: AbstractControllerConstructor;
}

/**
 * Parses the imported context to output an array of controller / identifier definitions.
 */
const controllerDefinitions: Definition[] = context
  .keys()
  .map((key) => ({
    controllerConstructor: (context(key) as ECMAScriptModule).default,
    identifier: getKebabCaseIdentifier(
      (key.match(/^(?:\.\/)?(.+)(?:[_-]controller\..+?)$/) || [])[1],
    ),
  }))
  .filter(
    (item): item is Definition =>
      item?.controllerConstructor?.isIncludedInCore && item?.identifier,
  );

export default controllerDefinitions;
