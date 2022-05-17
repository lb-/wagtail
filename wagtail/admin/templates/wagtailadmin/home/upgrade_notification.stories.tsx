import React from 'react';
import { Pattern, generateDocs } from 'storybook-django/src/react';

import template from './upgrade_notification.html';

const { argTypes } = generateDocs(template);

export default {
  title: 'Page / Home (Dashboard) / Upgrade Notification',
  argTypes: { ...argTypes },
  parameters: {},
};

const Template = (args) => <Pattern filename={__filename} context={args} />;

export const Base = Template.bind({});

Base.args = {};
