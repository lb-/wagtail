const NEXT_VERSION = '5.0';

/**
 * Sets up console.warn functions that make it easy to communicate deprecation warnings
 * in front-end code to developers.
 *
 * @returns {{}}
 */
const initDeprecationWarnings = () => {
  let isEnabled = false;

  document.addEventListener('wagtail:debug-enable', () => {
    isEnabled = true;
    // eslint-disable-next-line no-console
    console.info('Wagtail debug mode enabled');
  });

  document.addEventListener('wagtail:debug-disable', () => {
    isEnabled = false;
  });

  const warn = (
    {
      context,
      message,
    }: {
      context?: Record<string, unknown>;
      message: string;
    },
    version: string = NEXT_VERSION,
  ) => {
    if (!isEnabled) return;
    // eslint-disable-next-line no-console
    console.warn(message, { ...context, version });
  };

  return {
    removedInWagtail50Warning: (message, context) => {
      warn({ message, context });
    },
    removedInWagtail60Warning: (message, context) => {
      warn({ message, context }, '6.0');
    },
  };
};

const { removedInWagtail50Warning, removedInWagtail60Warning } =
  initDeprecationWarnings();

export { removedInWagtail50Warning, removedInWagtail60Warning };
