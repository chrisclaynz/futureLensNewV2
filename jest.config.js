module.exports = {
    transform: {
        '^.+\\.jsx?$': 'babel-jest',
    },
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./src/test/setup.js'],
    transformIgnorePatterns: [
        'node_modules/(?!(@supabase|.*.mjs$))'
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    }
}; 