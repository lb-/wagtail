// Rules which have been enforced in configuration upgrades and flag issues in existing code.
// We need to consider whether to disable those rules permanently, or fix the issues.
const legacyCode = {
  'constructor-super': 'off',
  'default-param-last': 'off',
  'no-continue': 'off',
  'no-plusplus': 'off',
  'no-prototype-builtins': 'off',
  'no-restricted-syntax': 'off',
  'no-this-before-super': 'off',
};

module.exports = {
  extends: [
    '@wagtail/eslint-config-wagtail',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  env: {
    jest: true,
    browser: true,
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-use-before-define': ['error'],
    'class-methods-use-this': 'off',
    'import/extensions': [
      'error',
      'always',
      {
        ignorePackages: true,
        pattern: {
          js: 'never',
          jsx: 'never',
          ts: 'never',
          tsx: 'never',
        },
      },
    ],
    // does not align with the majority of legacy and newer code, some use named others use default exports
    'import/prefer-default-export': 'off',
    'max-classes-per-file': 'off',
    // note you must disable the base rule as it can report incorrect errors
    'no-use-before-define': 'off',
    'react/jsx-filename-extension': ['error', { extensions: ['.js', '.tsx'] }],
    'no-underscore-dangle': [
      'error',
      { allow: ['__REDUX_DEVTOOLS_EXTENSION__'] },
    ],
  },
  settings: {
    'import/core-modules': ['jquery'],
    'import/resolver': { node: { extensions: ['.js', '.ts', '.tsx'] } },
  },
  overrides: [
    // Legacy Code - remove from `files` when adopting desired rules in new code progressively
    {
      files: [
        'client/src/entrypoints/admin/bulk-actions.js',
        'client/src/entrypoints/admin/core.js',
        'client/src/entrypoints/admin/expanding-formset.js',
        'client/src/entrypoints/admin/filtered-select.js',
        'client/src/entrypoints/admin/page-editor.js',
        'client/src/entrypoints/admin/telepath/widgets.js',
        'client/src/entrypoints/contrib/table_block/table.js',
        'client/src/entrypoints/contrib/typed_table_block/typed_table_block.js',
      ],
      rules: legacyCode,
    },
    // Legacy Code (React) - remove from `files` when adopting desired rules in new code progressively
    {
      files: ['client/src/components/**'],
      rules: {
        ...legacyCode,
        'jsx-a11y/anchor-is-valid': 'off',
        'jsx-a11y/click-events-have-key-events': 'off',
        'jsx-a11y/interactive-supports-focus': 'off',
        'jsx-a11y/no-noninteractive-element-interactions': 'off',
        'jsx-a11y/role-supports-aria-props': 'off',
        'react-hooks/exhaustive-deps': 'off',
        'react-hooks/rules-of-hooks': 'off',
        'react/button-has-type': 'off',
        'react/destructuring-assignment': 'off',
        'react/forbid-prop-types': 'off',
        'react/function-component-definition': 'off',
        'react/jsx-no-useless-fragment': 'off',
        'react/jsx-props-no-spreading': 'off',
        'react/no-danger': 'off',
        'react/no-deprecated': 'off',
        'react/require-default-props': 'off',
      },
    },
    // Rules we don’t want to enforce for test and tooling code.
    {
      files: [
        'client/extract-translatable-strings.js',
        'client/tests/**',
        'webpack.config.js',
        'tailwind.config.js',
        'storybook/**/*',
        '*.test.ts',
        '*.test.tsx',
        '*.test.js',
        '*.stories.js',
        '*.stories.tsx',
      ],
      rules: {
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        'global-require': 'off',
        'import/no-extraneous-dependencies': 'off',
        'no-unused-expressions': 'off',
        'react/function-component-definition': 'off',
        'react/jsx-props-no-spreading': 'off',
      },
    },
    // Files that use jquery via a global
    {
      files: [
        '**/static_src/**',
        'contrib/modeladmin/static_src/wagtailmodeladmin/js/prepopulate.js',
        'docs/_static/**',
        'wagtail/search/templates/wagtailsearch/queries/chooser_field.js',
      ],
      globals: { $: 'readonly', jQuery: 'readonly' },
    },
    // Files that use other globals or legacy/vendor code that is unable to be easily linted
    {
      files: [
        'wagtail/**/**',
        'client/src/entrypoints/documents/document-chooser-modal.js',
        'client/src/entrypoints/images/image-chooser-modal.js',
      ],
      globals: {
        addMessage: 'readonly',
        buildExpandingFormset: 'readonly',
        cancelSpinner: 'readonly',
        escapeHtml: 'readonly',
        jsonData: 'readonly',
        ModalWorkflow: 'readonly',
        DOCUMENT_CHOOSER_MODAL_ONLOAD_HANDLERS: 'writable',
        EMBED_CHOOSER_MODAL_ONLOAD_HANDLERS: 'writable',
        IMAGE_CHOOSER_MODAL_ONLOAD_HANDLERS: 'writable',
        QUERY_CHOOSER_MODAL_ONLOAD_HANDLERS: 'writable',
        SNIPPET_CHOOSER_MODAL_ONLOAD_HANDLERS: 'writable',
      },
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        'camelcase': [
          'error',
          {
            allow: [
              '__unused_webpack_module',
              '__webpack_modules__',
              '__webpack_require__',
            ],
            properties: 'never',
          },
        ],
        'consistent-return': 'off',
        'func-names': 'off',
        'id-length': 'off',
        'key-spacing': 'off',
        'new-cap': 'off',
        'newline-per-chained-call': 'off',
        'no-param-reassign': 'off',
        'no-underscore-dangle': 'off',
        'object-shorthand': 'off',
        'prefer-arrow-callback': 'off',
        'vars-on-top': 'off',
      },
    },
  ],
};
