/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@eduflow/common(.*)$': '<rootDir>/../../libs/common/src$1',
    '^@eduflow/constants(.*)$': '<rootDir>/../../libs/constants/src$1',
    '^@eduflow/types(.*)$': '<rootDir>/../../libs/types/src$1',
    '^@eduflow/middleware(.*)$': '<rootDir>/../../libs/middleware/src$1',
    '^@eduflow/prisma(.*)$': '<rootDir>/../../libs/prisma/src$1',
    '^.prisma/client$': '<rootDir>/../../libs/prisma/client',
    '^.prisma/client/default$': '<rootDir>/../../libs/prisma/client/index.js',
    '^.prisma/client/index$': '<rootDir>/../../libs/prisma/client/index.js'
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/test/**/*.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
