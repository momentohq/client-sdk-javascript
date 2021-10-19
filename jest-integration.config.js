module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/integration'],
    testMatch: ['**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
};
