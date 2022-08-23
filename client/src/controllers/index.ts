import { AutoFieldController } from './AutoFieldController';

/**
 * Important: Only add default core controllers that should load with the base admin JS bundle.
 */
export const coreControllerDefinitions = [
  { controllerConstructor: AutoFieldController, identifier: 'w-auto-field' },
];
