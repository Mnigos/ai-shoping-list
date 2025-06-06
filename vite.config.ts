import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import babel from 'vite-plugin-babel'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
	plugins: [
		tailwindcss(),
		!process.env.VITEST && reactRouter(),
		tsconfigPaths(),
		svgr(),
		babel({
			filter: /\.tsx?$/,
			babelConfig: {
				presets: ['@babel/preset-typescript'],
				plugins: ['babel-plugin-react-compiler'],
			},
		}),
	],
})
