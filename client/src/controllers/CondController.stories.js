import React from 'react';

import { StimulusWrapper } from '../../storybook/StimulusWrapper';
import { CondController } from './CondController';

export default {
  title: 'Stimulus / CondController',
  argTypes: {
    debug: { control: 'boolean', defaultValue: false },
  },
};

const definitions = [
  { identifier: 'w-cond', controllerConstructor: CondController },
];

const EnableTemplate = ({ debug = false }) => (
  <StimulusWrapper debug={debug} definitions={definitions}>
    <form
      method="get"
      data-controller="w-cond"
      // avoid accidental submissions with preventing submit
      data-action="change->w-cond#resolve submit->w-cond#resolve:prevent"
    >
      <div className="w-field__wrapper">
        <label className="w-field__label" htmlFor="link-field">
          Enter a link:
          <div className="w-field">
            <div className="w-field__input">
              <input type="url" name="link" id="link-field" />
            </div>
          </div>
        </label>
      </div>
      <div className="w-field__wrapper">
        <label className="w-field__label" htmlFor="email-field">
          Or enter an Email address:
          <div className="w-field">
            <div className="w-field__input">
              <input type="email" name="email" id="email-field" />
            </div>
          </div>
        </label>
      </div>
      <hr />
      <div>
        <label className="w-field__label" htmlFor="drink">
          Enter an email subject:
          <div className="w-field">
            <div className="w-field__input">
              <input
                type="text"
                name="subject"
                className="w-field__wrapper"
                data-w-cond-target="enable"
                data-match='{"link":""}'
              />
            </div>
          </div>
        </label>
      </div>
      <div className="w-field__wrapper">
        <label className="w-field__label" htmlFor="subject-field">
          Enter a link label:
          <div className="w-field">
            <div className="w-field__input">
              <input
                type="email"
                name="subject"
                id="subject-field"
                data-w-cond-target="enable"
                data-match='{"email":""}'
              />
            </div>
          </div>
        </label>
      </div>
    </form>
  </StimulusWrapper>
);

export const Enable = EnableTemplate.bind({});
