import UpgradeController from './upgrade-controller';

/** Official 'core' controllers
 * - add entries here to expose by default in the core js bundle
 * */
const CONTROLLERS = [UpgradeController];

const getIdentifier = (controllerConstructor, { prefix } = {}) => {
  const name = controllerConstructor.name.replace(/[cC]ontroller$/, '');
  if (name) {
    const kebabCaseName = name
      .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
      .toLowerCase();
    return prefix ? [prefix, kebabCaseName].join('') : kebabCaseName;
  }
  return null;
};

export const controllers = CONTROLLERS.map((controllerConstructor) => ({
  identifier: getIdentifier(controllerConstructor),
  controllerConstructor,
}));
