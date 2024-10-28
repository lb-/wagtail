import React, { useState } from 'react';

import { StimulusWrapper } from '../../storybook/StimulusWrapper';
import { TabsController } from './TabsController';

export default {
  title: 'Stimulus / TabsController',
  argTypes: {
    debug: {
      control: 'boolean',
      defaultValue: false,
    },
  },
};

const definitions = [
  {
    identifier: 'w-tabs',
    controllerConstructor: TabsController,
  },
];

const Template = ({ debug = false }) => {
  const [submitCount, updateSubmitCount] = useState(0);

  return (
    <StimulusWrapper debug={debug} definitions={definitions}>
      <div data-controller="w-tabs" data-w-tabs-selected-class="animate-in">
        <div
          role="tablist"
          data-action="keydown.right->w-tabs#selectNext keydown.left->w-tabs#selectPrevious keydown.home->w-tabs#selectFirst keydown.end->w-tabs#selectLast"
        >
          <a
            id="tab-label-tab-1"
            href="#tab-tab-1"
            role="tab"
            data-w-tabs-target="tab"
            data-action="w-tabs#select:prevent"
          >
            Tab 1
          </a>
          <a
            id="tab-label-tab-2"
            href="#tab-tab-2"
            role="tab"
            data-w-tabs-target="tab"
            data-action="w-tabs#select:prevent"
          >
            Tab 2
          </a>
        </div>
        <div className="tab-content">
          <section
            id="tab-tab-1"
            role="tabpanel"
            aria-labelledby="tab-label-tab-1"
            data-w-tabs-target="panel"
          >
            Tab 1 content
          </section>
          <section
            id="tab-tab-2"
            role="tabpanel"
            aria-labelledby="tab-label-tab-2"
            data-w-tabs-target="panel"
          >
            Tab 2 content
          </section>
        </div>
      </div>
    </StimulusWrapper>
  );
};

export const Base = Template.bind({});
