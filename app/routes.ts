import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
	route('/api/trpc/*', 'routes/api.trpc.$.ts'),
	route('/api/auth/*', 'routes/api.auth.$.ts'),

	index('routes/home.route.tsx'),
] satisfies RouteConfig
