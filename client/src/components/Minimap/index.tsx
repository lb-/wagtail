import React from 'react';
import ReactDOM from 'react-dom';
import type { Application } from '@hotwired/stimulus';
import type { PanelController } from '../../controllers/PanelController';
import { MinimapMenuItem } from './MinimapItem';

import { debounce } from '../../utils/debounce';

import Minimap from './Minimap';

declare global {
  interface Window {
    Stimulus: Application;
  }
}

/**
 * Generate a minimap link’s data, based on the panel’s elements.
 */
const createMinimapLink = (
  anchor: HTMLAnchorElement,
): MinimapMenuItem | null => {
  const panelSelector = `[data-controller~="w-panel"]`;
  const panel = anchor.closest<HTMLElement>(panelSelector);

  // Special case for InlinePanel, where deleted items are kept until the form is saved.
  const inlinePanelDeleted = anchor.closest(
    '[data-inline-panel-child].deleted',
  );

  if (!panel || inlinePanelDeleted) return null;

  const panelController = window.Stimulus.getControllerForElementAndIdentifier(
    panel,
    'w-panel',
  ) as PanelController;

  if (!panelController) return null;

  const heading = panelController.headingTarget;
  const toggle = panelController.toggleTarget;

  if (!toggle || !heading) return null;

  const { icon, label, level, requiredValue: required } = panelController;
  const headingLevel = `h${level}`;

  const errorCount = [].slice
    .call(panel.querySelectorAll('.error-message'))
    .filter((err) => err.closest(panelSelector) === panel).length;

  return {
    anchor,
    toggle,
    panel,
    icon,
    label: label || '',
    // Use the attribute rather than property so we only have a hash.
    href: anchor.getAttribute('href') || '',
    required,
    errorCount,
    level: headingLevel as MinimapMenuItem['level'],
  };
};

/**
 * Render the minimap component within a given element.
 * Populates the minimap with the relevant links based on currently-visible collapsible panels.
 */
const renderMinimap = (container: HTMLElement) => {
  let anchorsContainer: HTMLElement = document.body;
  const tabs = document.querySelector('[data-tabs]');

  // Render the minimap based on the active tab when there are tabs.
  if (tabs) {
    const activeTab = tabs.querySelector('[role="tab"][aria-selected="true"]');
    const panelId = activeTab?.getAttribute('aria-controls');
    const activeTabpanel = tabs.querySelector<HTMLElement>(`#${panelId}`);
    anchorsContainer = activeTabpanel || anchorsContainer;
  }

  const anchors = anchorsContainer.querySelectorAll<HTMLAnchorElement>(
    '[data-w-panel-target~="anchor"]',
  );
  const links: MinimapMenuItem[] = [].slice
    .call(anchors)
    .map(createMinimapLink)
    .filter(Boolean);

  const toggleAllPanels = (expanded) => {
    links.forEach((link, i) => {
      // Avoid collapsing the title field, where the collapse toggle is hidden.
      const isTitle = i === 0 && link.href.includes('title');
      if (!isTitle) {
        link.panel.dispatchEvent(
          new CustomEvent(expanded ? 'w-panel:open' : 'w-panel:close', {
            cancelable: false,
            bubbles: false,
          }),
        );
      }
    });
  };

  ReactDOM.render(
    <Minimap
      container={container}
      anchorsContainer={anchorsContainer}
      links={links}
      onUpdate={renderMinimap}
      toggleAllPanels={toggleAllPanels}
    />,
    container,
  );
};

/**
 * Initialise the minimap within the target element,
 * making sure it re-renders when the visible content changes.
 */
export const initMinimap = (
  container = document.querySelector<HTMLElement>('[data-minimap-container]'),
) => {
  if (!container) {
    return;
  }

  const updateMinimap = debounce(renderMinimap.bind(null, container), 100);

  document.addEventListener('wagtail:tab-changed', updateMinimap);
  document.addEventListener('w-panel:ready', updateMinimap);

  // Make sure the positioning of the minimap is always correct.
  const setOffsetTop = () =>
    container.style.setProperty('--offset-top', `${container.offsetTop}px`);
  const updateOffsetTop = debounce(setOffsetTop, 100);

  document.addEventListener('resize', updateOffsetTop);

  setOffsetTop();
  updateMinimap(container);
};
