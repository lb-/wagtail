import { Application } from '@hotwired/stimulus';

import { controllers } from '../../controllers/';

const Stimulus = Application.start();

Stimulus.load(controllers);

window.stimulus = {
  register: (identifier, controller) =>
    Stimulus.register(identifier, controller),
};
