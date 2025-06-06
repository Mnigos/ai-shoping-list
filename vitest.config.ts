/// <reference types="vitest" />

import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
	viteConfig,
	defineConfig({
		test: {
			resolveSnapshotPath: (testPath, snapshotExtension) =>
				`./tests/snapshots/${testPath.split('/').at(-1)}${snapshotExtension}`,
			globals: true,
			environment: 'happy-dom',
			setupFiles: './tests/vitest.setup.happy-dom.ts',
			environmentMatchGlobs: [['**/.server/**/*.test.{ts,tsx}', 'node']],
			coverage: {
				provider: 'v8',
				reporter: ['text', 'json', 'html', 'lcov'],
				exclude: [
					'**/node_modules/**',
					'**/.next/**',
					'**/modules/**',
					'**/pages/**',
					'**/types/**',
					'**/constants/**',
					'**/tests/**',
					'**/index.ts',
					'**/*.config.ts',
					'**/*.config.js',
					'**/*.d.ts',
					'**/*.svg.*',
					'**/*.spec.ts',
					'**/*.spec.tsx',
					'**/*.stories.tsx',
					'**/*.skeleton.tsx',
					'**/.storybook/**',
					'**/storybook-static/**',
					'postcss.config.mjs',
					'convex/_generated/**',
				],
				all: true,
			},
			exclude: ['**/tests/**', '**/node_modules/**'],
		},
	}),
)
