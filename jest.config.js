module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/index.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 10000
};
