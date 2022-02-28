/**
 * Import and register all core controllers as an exported entry point.
 *
 * */
import { BaseController } from '../../controllers/base-controller';

import * as controllers from '../../controllers';

Object.values(controllers).forEach((controller) => {
  // ensure we do not attempt to register _esModule or other non-registerable imports
  if (typeof controller.initRegister !== 'function') return;
  // ensure we do not accidentally try to register the base controller
  if (controller === BaseController) return;
  // call each controller's `initRegister` function (see BaseController)
  controller.initRegister();
});
