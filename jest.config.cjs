// jest.config.cjs

module.exports = {
  preset: 'ts-jest/presets/js-with-ts-esm',
  setupFiles: ['./jest.setup.js'],
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': 'babel-jest',
  },
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};
