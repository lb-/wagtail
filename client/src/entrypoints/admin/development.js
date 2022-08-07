// see client/src/utils/deprecation.ts - enable client-side debug

document.addEventListener('DOMContentLoaded', () => {
  document.dispatchEvent(new CustomEvent('wagtail:debug-enable'));
});
