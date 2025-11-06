/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type {Config} from 'jest';
import nextJest from 'next/jest';
import 'dotenv/config';

const createJestConfig = nextJest({ dir: './' });

const jestConfig = async (): Promise<Config> => {
    const commonModuleNameMapper = {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@models/(.*)$': '<rootDir>/src/models/$1',
        '^@services/(.*)$': '<rootDir>/src/services/$1',
    };

    const baseCustom = {
        testEnvironment: 'node',
        setupFiles: ['dotenv/config', '<rootDir>/jest.setup.js'],
        transform: { '^.+\\.tsx?$': 'ts-jest' },
        moduleNameMapper: commonModuleNameMapper,
        globals: { 'ts-jest': { tsconfig: '<rootDir>/tsconfig.json' } },
    };

    const unitCustom = {
        ...baseCustom,
        displayName: 'unit',
        testMatch: ['**/__tests__/**/*.unit.test.*', '**/__tests__/**/*.test.ts?(x)'],
    };

    const integrationCustom = {
        ...baseCustom,
        displayName: 'integration',
        testMatch: ['**/__tests__/**/*.int.test.*'],
        testTimeout: 30000 as number
    };

    const unitConfig = await createJestConfig(unitCustom)();
    const integrationConfig = await createJestConfig(integrationCustom)();

    return {
        projects: [unitConfig, integrationConfig],
    };
};

export default jestConfig;
