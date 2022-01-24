import UpgradeController from './upgrade-controller';

const controllers = [UpgradeController].map((controllerConstructor) => ({
  controllerConstructor,
  identifier: `wg-${controllerConstructor.identifier}`,
}));

export { controllers };
