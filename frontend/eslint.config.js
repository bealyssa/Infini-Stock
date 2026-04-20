import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
    { ignores: ['dist', 'node_modules', 'build'] },
    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            globals: globals.browser,
            parserOptions: {
                ecmaFeatures: { jsx: true }
            }
        },
        plugins: {
            react,
            'react-hooks': reactHooks
        },
        rules: {
            ...(() => {
                const baseRules = { ...js.configs.recommended.rules, ...react.configs.recommended.rules, ...reactHooks.configs.recommended.rules };
                // Convert all errors in base config to warnings for flexibility
                const flexibleRules = {};
                for (const [key, value] of Object.entries(baseRules)) {
                    if (value === 'error' || (Array.isArray(value) && value[0] === 'error')) {
                        flexibleRules[key] = 'warn';
                    } else {
                        flexibleRules[key] = value;
                    }
                }
                return flexibleRules;
            })(),

            // Keep critical React rules as errors
            'react-hooks/rules-of-hooks': 'error',
            'no-undef': 'error',

            // Explicit rule configurations
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/jsx-uses-react': 'off',
            'react-hooks/exhaustive-deps': 'warn',
            'react-hooks/set-state-in-effect': 'off',
            'react/no-array-index-key': 'off',
            'react/display-name': 'off',
            'no-unused-vars': 'warn',
            'no-console': 'warn',
            'no-useless-assignment': 'warn',
            'no-useless-escape': 'warn',
            'no-const-assign': 'warn',
            'no-var': 'warn'
        },
        settings: {
            react: {
                version: 'detect'
            }
        }
    }
];
