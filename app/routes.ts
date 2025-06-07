import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
	route('/api/trpc/*', 'routes/api.trpc.$.ts'),
	route('/api/auth/*', 'routes/api.auth.$.ts'),

	index('routes/home.route.tsx'),

	route('/join-group/:token', 'routes/join-group.$token.tsx'),
	route('/groups', 'routes/groups.tsx'),
	route('/groups/:groupId', 'routes/groups.$groupId.tsx'),
] satisfies RouteConfig
