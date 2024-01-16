"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    moduleFileExtensions: ['ts', 'js'],
    transform: {
      '^.+\\.(ts|tsx)$': ['ts-jest', {
        tsConfig: 'tsconfig.json',
      }],
    },
    testPathIgnorePatterns: ['/node_modules/','/src/test/'],
    testMatch: ['**/src/**/*.test.+(ts|js)']
};
//# sourceMappingURL=jest.config.js.map
