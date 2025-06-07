import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '~/lib/trpc/react'
import { createTRPC } from '~/lib/trpc/server'
import { GroupsPage } from '~/modules/group/components/groups-page'
import type { Route } from './+types/groups'

export function meta() {
	return [
		{ title: 'My Groups - AI Shopping List' },
		{
			name: 'description',
			content: 'Manage your shopping list groups and settings',
		},
	]
}

export async function loader(loaderArgs: Route.LoaderArgs) {
	const queryClient = getQueryClient()
	const trpc = await createTRPC(loaderArgs)

	// Prefetch user's groups
	await queryClient.prefetchQuery(trpc.group.getMyGroups.queryOptions())

	return {
		queryClient: dehydrate(queryClient),
	}
}

export default function GroupsRoute({
	loaderData: { queryClient },
}: Route.ComponentProps) {
	return (
		<HydrationBoundary state={queryClient}>
			<GroupsPage />
		</HydrationBoundary>
	)
}
