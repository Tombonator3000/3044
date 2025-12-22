module.exports = {
    testEnvironment: 'node',
    transform: {
        '^.+\\.js$': 'babel-jest'
    },
    testMatch: ['**/tests/**/*.test.js'],
    moduleFileExtensions: ['js'],
    collectCoverageFrom: [
        'js/**/*.js',
        '!js/main.js'
    ],
    coverageDirectory: 'coverage',
    verbose: true
};
