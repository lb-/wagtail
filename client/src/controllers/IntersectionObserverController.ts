import { AbstractController } from './AbstractController';

/**
 * ...
 */
export class IntersectionObserverController extends AbstractController {
  static isIncludedInCore = true;
  static targets = ['dispatch'];
  static values = {
    options: {
      default: { root: null, rootMargin: '0px', threshold: 0.1 },
      type: Object,
    },
  };

  dispatchTarget: HTMLElement;
  hasDispatchTarget: boolean;
  observer: IntersectionObserver | null;
  optionsValue: IntersectionObserverInit | undefined;
  waitValue: number | undefined;

  connect() {
    this.handleIntersectionObserverUpdate =
      this.handleIntersectionObserverUpdate.bind(this);

    this.observer = this.createObserver(this.optionsValue || {});
  }

  createObserver(options = {}) {
    if (this.observer) return this.observer;

    this.observer = new IntersectionObserver(
      this.handleIntersectionObserverUpdate,
      options,
    );

    this.observer.observe(this.element);

    return this.observer;
  }

  disconnect(): void {
    if (this.observer) this.observer.disconnect();
  }

  handleIntersectionObserverUpdate([
    { intersectionRatio, isIntersecting },
  ]: IntersectionObserverEntry[]) {
    const detail = { intersectionRatio, isIntersecting };
    const target = this.hasDispatchTarget ? this.dispatchTarget : this.element;
    this.dispatch('intersection', { cancelable: false, detail, target });
  }
}
