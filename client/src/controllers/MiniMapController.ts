import * as React from 'react';
import { v4 as uuidv4 } from 'uuid';
import ReactDOM from 'react-dom';

import { debounce } from '../utils/debounce';

import { MiniMapIndex } from '../components/MiniMapIndex';

import { AbstractController } from './AbstractController';

const DEFAULT_WAIT = 100;

/**
 * ...
 */
export class MiniMapController extends AbstractController {
  static isIncludedInCore = true;
  static classes = ['expanded', 'indexItem'];
  static targets = ['heading', 'index', 'miniMap'];
  static values = { wait: { default: DEFAULT_WAIT, type: Number } };

  expandedClasses: string[];
  headingTargets: HTMLElement[];
  indexItemClasses: string[];
  indexTarget: HTMLElement;
  intersections: Record<string, boolean>;
  miniMapTarget: HTMLElement;
  waitValue: number;

  connect() {
    this.intersections = {};

    this.headingTargets.forEach((element) => {
      this.setupHeading(element);
    });

    this.updateMiniMapList = debounce(
      this.updateMiniMapList.bind(this),
      this.waitValue || DEFAULT_WAIT,
    );

    this.updateMiniMapList();
    if (this.miniMapTarget.hidden) {
      this.miniMapTarget.removeAttribute('hidden');
    }
  }

  expand() {
    this.miniMapTarget.classList.add(...this.expandedClasses);
  }

  collapse() {
    this.miniMapTarget.classList.remove(...this.expandedClasses);
  }

  headingTargetConnected(element) {
    this.setupHeading(element);
  }

  /**
   * Ensure each heading has an id, if not - create one
   * // TODO - if not h2-h5? then remove attribute ?
   * // will not work for opening in a new link
   */
  setupHeading(element) {
    if (!element.id) element.setAttribute('id', uuidv4());
  }

  getLabel(element) {
    if (element.innerText) return element.innerText;

    if (element.nextElementSibling && element.nextElementSibling.innerText) {
      return element.nextElementSibling.innerText;
    }

    return '';
  }

  intersectionChanged({ detail: { isIntersecting = false }, target }) {
    // check if the target is a valid target in this controller's context
    if (!this.headingTargets.find((value) => value === target)) return;

    // update tracking of intersection via ids
    this.intersections[target.id] = isIntersecting;

    // reminder - updateMiniMapList is debounced to throttle DOM reading
    this.updateMiniMapList();
  }

  updateMiniMapList() {
    const className = this.indexItemClasses.join(' ');

    const items = this.headingTargets.map((element) => ({
      className,
      element,
      id: element.id,
      isIntersecting: this.intersections[element.id],
      label: this.getLabel(element),
      level: Number(element.tagName.replace(/\D/g, '')) || 0,
    }));

    ReactDOM.render(
      React.createElement(MiniMapIndex, { items }),
      this.indexTarget,
    );
  }
}
