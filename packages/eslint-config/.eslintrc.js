module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'folders',
    'boundaries',
    'functional'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/typescript',
    'plugin:functional/recommended',
    'plugin:functional/external-typescript-recommended'
  ],
  rules: {
    // Functional programming rules
    'functional/no-classes': 'error',
    'functional/no-this-expressions': 'error',
    'functional/prefer-readonly-type': 'error',
    'functional/no-let': 'error',
    'functional/immutable-data': 'error',
    'functional/no-loop-statements': 'error',
    'functional/no-throw-statements': 'error',
    'functional/no-mixed-types': 'error',
    'functional/prefer-tacit': 'error',

    // Dependency rules
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: ['**/*.test.ts', '**/*.spec.ts'],
      packageDir: ['./', './packages/shared-deps'],
      peerDependencies: true,
      optionalDependencies: false,
      bundledDependencies: false,
    }],
    'import/no-internal-modules': ['error', {
      allow: [
        '@eduflow/*/src/**',
        '@eduflow/types/src/**'
      ]
    }],

    // Package boundaries rules
    'boundaries/element-types': [
      'error',
      {
        default: 'disallow',
        rules: [
          // Types can only import from constants and must only contain type definitions
          {
            from: ['types'],
            allow: ['constants'],
            disallow: ['*Implementation', '*Service', '*Repository', '*Handler', '*Controller', '*Middleware'],
            message: 'Types package can only contain type definitions'
          },
          // Common can import from types and constants
          {
            from: ['common'],
            allow: ['types', 'constants', 'prisma', 'logger']
          },
          // Middleware can import from types, common, and constants
          {
            from: ['middleware'],
            allow: ['types', 'common', 'constants', 'logger']
          },
          // Events can import from types, common, and constants
          {
            from: ['events'],
            allow: ['types', 'common', 'constants', 'logger']
          },
          // Prisma can only import from types
          {
            from: ['prisma'],
            allow: ['types']
          },
          // Logger can import from types and constants
          {
            from: ['logger'],
            allow: ['types', 'constants']
          }
        ]
      }
    ],

    // Naming conventions
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface',
        format: ['PascalCase'],
        prefix: ['I']
      },
      {
        selector: 'typeAlias',
        format: ['PascalCase']
      },
      {
        selector: 'enum',
        format: ['PascalCase']
      }
    ],

    // Code style and safety
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
    'max-lines-per-function': ['error', { max: 20, skipBlankLines: true, skipComments: true }],
    'complexity': ['error', 10],

    // Documentation
    'require-jsdoc': ['error', {
      require: {
        FunctionDeclaration: true,
        ArrowFunctionExpression: true,
        FunctionExpression: true
      }
    }],

    // Prevent circular dependencies
    'import/no-cycle': 'error',

    // Enforce consistent imports
    'import/order': ['error', {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always',
      alphabetize: {
        order: 'asc',
        caseInsensitive: true
      }
    }]
  },
  overrides: [
    {
      files: ['**/*.test.ts'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'max-lines-per-function': 'off',
        'functional/no-throw-statements': 'off'
      },
    },
  ],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
      },
    },
    'boundaries/elements': [
      {
        type: 'types',
        pattern: 'libss/types',
        mode: 'folder',
        capture: ['domain']
      },
      {
        type: 'common',
        pattern: 'libss/common',
        mode: 'folder',
      },
      {
        type: 'middleware',
        pattern: 'libss/middleware',
        mode: 'folder',
      },
      {
        type: 'events',
        pattern: 'libss/events',
        mode: 'folder',
      },
      {
        type: 'prisma',
        pattern: 'libss/prisma',
        mode: 'folder',
      },
      {
        type: 'logger',
        pattern: 'libss/logger',
        mode: 'folder',
      },
      {
        type: 'constants',
        pattern: 'libss/constants',
        mode: 'folder',
      }
    ]
  },
}; 