import React from 'react';
import { Pattern, generateDocs } from 'storybook-django/src/react';

import template from './status_tag.html';

const { docs, argTypes } = generateDocs(template);

export default {
  parameters: { docs },
  argTypes: {
    ...argTypes,
  },
};

const Template = (args) => <Pattern filename={__filename} context={args} />;
export const Live = Template.bind({});

Live.args = {
  live: true,
  status_string: 'live',
};

export const Draft = Template.bind({});

Draft.args = {
  live: false,
  status_string: 'draft',
};
