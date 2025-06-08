import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '~/lib/trpc/react'
import { createTRPC } from '~/lib/trpc/server'
import { GroupPage } from '~/modules/group/components/group-page'
import type { Route } from './+types/groups.$id.route'

export function meta({ params }: Route.MetaArgs) {
	return [
		{ title: 'Group - AI Shopping List' },
		{
			name: 'description',
			content: 'Manage your group shopping list and chat with members',
		},
	]
}

export async function loader(loaderArgs: Route.LoaderArgs) {
	const queryClient = getQueryClient()
	const trpc = await createTRPC(loaderArgs)
	const { id } = loaderArgs.params

	// Prefetch group details and shopping list items
	try {
		await Promise.all([
			queryClient.prefetchQuery(trpc.group.getGroup.queryOptions({ id })),
			queryClient.prefetchQuery(
				trpc.shoppingList.getItems.queryOptions({ groupId: id }),
			),
		])
	} catch (error) {
		// If prefetch fails, we'll handle it in the component
		console.warn('Failed to prefetch group data:', error)
	}

	return {
		queryClient: dehydrate(queryClient),
		id,
	}
}

export default function GroupRoute({
	loaderData: { queryClient, id },
}: Route.ComponentProps) {
	return (
		<HydrationBoundary state={queryClient}>
			<GroupPage groupId={id} />
		</HydrationBoundary>
	)
}
