import { Controller } from '@hotwired/stimulus';
import type { ControllerConstructor } from '@hotwired/stimulus';

export interface AbstractControllerConstructor extends ControllerConstructor {
  isIncludedInCore?: boolean;
}

type DispatchEventName = Parameters<typeof Controller.prototype.dispatch>[0];
type DispatchEventOptions = Exclude<
  Parameters<typeof Controller.prototype.dispatch>[1],
  undefined
>;

type DetailWithResume = {
  [otherDetail: string | number | symbol]: any;
  resume: (options: Record<string, any>) => void;
};

interface DispatchEventOptionsWithResume extends DispatchEventOptions {
  detail: Exclude<DispatchEventOptions['detail'], undefined> & DetailWithResume;
}

/**
 * Wraps the supplied function so that it can only be called once, even when the result function
 * is called multiple times. Inspired by lodash once/before.
 * https://github.com/lodash/lodash/blob/ddfd9b11a0126db2302cb70ec9973b66baec0975/lodash.js#L10042
 */
function once(func) {
  let result;
  let fn = func;

  return function onceInnerFn(...args) {
    if (!fn) return result;
    result = fn.apply(this, args);
    fn = null;
    return result;
  };
}

/**
 * Core abstract controller to keep any specific logic that is desired and
 * to house generic types as needed.
 */
export abstract class AbstractController extends Controller {
  static isIncludedInCore = false;

  /**
   * Dispatch an event which can be cancelled and return a promise that resolves once dispatched.
   * The event will Supply provide a `resume` function in its detail.
   * Providing a way for the event's default to be prevented and re-activated later.
   *
   * Intentionally allows the resume never to be called, but if called multiple times the
   * original `resume` function will only ever one once.
   *
   * @param eventName
   * @param options - additional options to pass to the `dispatch` call
   * @param options.resume - callback provided to detail or called if the event is not prevented, will only ever trigger once
   * @returns
   */
  dispatchResume(
    eventName: DispatchEventName,
    {
      detail: { resume: resumeOriginal, ...detail },
      ...options
    }: DispatchEventOptionsWithResume,
  ) {
    return new Promise<CustomEvent>((resolve, reject) => {
      if (typeof resumeOriginal !== 'function') {
        reject(new Error('detail.resume must be a function'));
        return;
      }

      const resume = once(resumeOriginal);

      const event = this.dispatch(eventName, {
        ...options,
        detail: { ...detail, resume },
        cancelable: true,
      });

      if (!event.defaultPrevented) resume({});

      resolve(event);
    });
  }

  /**
   * Dispatches an animation (update classes) with pre-defined events begin/end
   *
   * Inspired by https://animate.style/#javascript
   *
   * @param classes - string or array of string for the animation classes to be added
   * @param options
   */
  dispatchAnimate(
    classes: string | string[],
    {
      detail: detailOriginal = {},
      target = this.element,
      ...options
    }: DispatchEventOptions = {},
  ) {
    return new Promise<{
      animateClasses: string[];
      detail: Record<string, any>;
      events: (CustomEvent | null)[];
      target: Element | HTMLElement;
    }>((resolve, reject) => {
      const animateClasses =
        typeof classes === 'string' ? classes.split(' ') : classes;

      const detail = { ...detailOriginal, animateClasses };

      if (!animateClasses.length) {
        reject(new Error('animation classes must be supplied'));

        return;
      }

      const eventOptions = { ...options, target, detail };

      const beforeAnimateEvent = this.dispatch('before-animate', eventOptions);

      target.classList.add(...animateClasses);
      target.addEventListener(
        'animationend',
        // when the animation ends, we clean the classes and resolve the Promise
        () => {
          target.classList.remove(...animateClasses);

          const afterAnimateEvent = this.dispatch(
            'after-animate',
            eventOptions,
          );

          const events = [beforeAnimateEvent, null, null, afterAnimateEvent];

          resolve({ animateClasses, detail, events, target });
        },
        { once: true },
      );
    });
  }
}
