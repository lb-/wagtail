import React from 'react';
import { Pattern, generateDocs } from 'storybook-django/src/react';

import template from './status_tag.html';

const { docs, argTypes } = generateDocs(template);

export default {
  parameters: { docs },
  argTypes: {
    ...argTypes,
    classname: {
      options: [null, 'primary', 'status-tag--label'],
    },
  },
};

const Template = (args) => <Pattern filename={__filename} context={args} />;
export const Live = Template.bind({});

Live.args = {
  children: 'live',
  classname: null,
};
