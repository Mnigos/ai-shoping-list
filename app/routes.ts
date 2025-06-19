import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
	route('/api/trpc/*', 'routes/api.trpc.$.ts'),
	route('/api/auth/*', 'routes/api.auth.$.ts'),

	index('routes/home.route.tsx'),

	route('/invite/:code', 'modules/group/routes/invite.$code.route.tsx'),
	route('/groups', 'modules/group/routes/groups.route.tsx'),
	route('/groups/:id', 'modules/group/routes/groups.$id.route.tsx'),
	route(
		'/groups/:id/settings',
		'modules/group/routes/groups.$id.settings.route.tsx',
	),
] satisfies RouteConfig
