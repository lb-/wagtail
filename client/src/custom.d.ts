export interface WagtailConfig {
  ADMIN_API: {
    PAGES: string;
    DOCUMENTS: string;
    IMAGES: string;
    EXTRA_CHILDREN_PARAMETERS: string;
  };

  ADMIN_URLS: {
    DISMISSIBLES: string;
    PAGES: string;
  };

  CHOOSER_URLS: Record<string, string>;

  CSRF_HEADER_NAME: string;
  CSRF_TOKEN: string;

  I18N_ENABLED: boolean;
  LOCALES: {
    code: string;

    display_name: string;
  }[];
}

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__: any;
    telepath: any;
  }

  // Get text

  // Wagtail globals

  const wagtailConfig: WagtailConfig;
}
