import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
	route('/api/trpc/*', 'routes/api.trpc.$.ts'),
	route('/api/auth/*', 'routes/api.auth.$.ts'),

	index('routes/home.route.tsx'),

	route('/join-group/:token', 'routes/join-group.$token.tsx'),
	route('/invite/:code', 'routes/invite.$code.route.tsx'),
	route('/groups', 'routes/groups.route.tsx'),
	route('/groups/:id', 'routes/groups.$id.route.tsx'),
	route('/groups/:id/settings', 'routes/groups.$id.settings.route.tsx'),
] satisfies RouteConfig
