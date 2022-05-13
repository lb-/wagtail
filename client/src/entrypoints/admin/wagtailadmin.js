import React from 'react';
import ReactDOM from 'react-dom';
import { Icon, Portal } from '../..';
import { initModernDropdown, initTooltips } from '../../includes/initTooltips';
import { initTabs } from '../../includes/tabs';
import { dialog } from '../../includes/dialog';
import initCollapsibleBreadcrumbs from '../../includes/breadcrumbs';
import initSidePanel from '../../includes/sidePanel';

if (process.env.NODE_ENV === 'development') {
  // Run react-axe in development only, so it does not affect performance
  // in production, and does not break unit tests either.
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires, import/no-extraneous-dependencies
  const axe = require('react-axe');
  axe(React, ReactDOM, 1000);
}

// Expose components as globals for third-party reuse.
window.wagtail.components = {
  Icon,
  Portal,
};

/**
 * Add in here code to run once the page is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  initTooltips();
  initModernDropdown();
  initTabs();
  dialog();
  initCollapsibleBreadcrumbs();
  initSidePanel();
});
