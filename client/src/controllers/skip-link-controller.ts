import AbstractController from './abstract-controller';

/**
 * Used to provide an accessible skip link for keyboard control so that
 * users can easily navigate beyond the repeated content to the main content.
 *
 * Inspired by https://github.com/selfthinker/dokuwiki_template_writr/blob/master/js/skip-link-focus-fix.js
 *
 * @example
 * <a class="button" href="#main" data-controller="w-skip-link" data-action="w-skip-link#skipToContent">Skip to main content</a>
 *
 */
export default class SkipLinkController extends AbstractController {
  static isIncludedInCore = true;

  skipToTarget: HTMLElement | null;

  connect() {
    this.skipToTarget = document.querySelector(
      this.element.getAttribute('href') || 'main',
    );
  }

  handleBlur = () => {
    if (!this.skipToTarget) return;
    this.skipToTarget.removeAttribute('tabindex');
    this.skipToTarget.removeEventListener('blur', this.handleBlur);
    this.skipToTarget.removeEventListener('focusout', this.handleBlur);
  };

  skipToContent() {
    if (!this.skipToTarget) return;
    this.skipToTarget.setAttribute('tabindex', '-1');
    this.skipToTarget.addEventListener('blur', this.handleBlur);
    this.skipToTarget.addEventListener('focusout', this.handleBlur);
    this.skipToTarget.focus();
  }
}
