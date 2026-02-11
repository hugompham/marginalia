import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
	js.configs.recommended,
	{
		files: ['**/*.{js,ts,svelte}'],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: './tsconfig.json',
				extraFileExtensions: ['.svelte']
			}
		},
		plugins: {
			'@typescript-eslint': ts
		},
		rules: {
			...ts.configs.recommended.rules,
			'no-undef': 'off',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_'
				}
			],
			'@typescript-eslint/no-explicit-any': 'warn'
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tsParser,
				project: './tsconfig.json',
				extraFileExtensions: ['.svelte']
			}
		},
		plugins: {
			svelte,
			'@typescript-eslint': ts
		},
		rules: {
			...svelte.configs.recommended.rules,
			'svelte/no-at-html-tags': 'warn',
			'no-undef': 'off',
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_'
				}
			]
		}
	},
	prettier,
	{
		ignores: [
			'.svelte-kit/**',
			'build/**',
			'coverage/**',
			'dist/**',
			'node_modules/**',
			'src/lib/types/database.ts',
			'src/app.d.ts',
			'supabase/functions/**',
			'**/*.config.js',
			'**/*.config.ts'
		]
	}
];
