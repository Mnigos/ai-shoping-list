import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '~/lib/trpc/react'
import { createTRPC } from '~/lib/trpc/server'
import { GroupSettingsPage } from '~/modules/group/components/group-settings-page'
import type { Route } from './+types/groups.$groupId'

export function meta({ params }: Route.MetaArgs) {
	return [
		{ title: 'Group Settings - AI Shopping List' },
		{
			name: 'description',
			content: 'Manage group settings, members, and invitations',
		},
	]
}

export async function loader(loaderArgs: Route.LoaderArgs) {
	const queryClient = getQueryClient()
	const trpc = await createTRPC(loaderArgs)
	const { groupId } = loaderArgs.params

	// Prefetch group details and members
	try {
		await Promise.all([
			queryClient.prefetchQuery(
				trpc.group.getGroupDetails.queryOptions({ id: groupId }),
			),
			queryClient.prefetchQuery(
				trpc.group.getMembers.queryOptions({ groupId }),
			),
		])
	} catch (error) {
		// If prefetch fails, we'll handle it in the component
		console.warn('Failed to prefetch group data:', error)
	}

	return {
		queryClient: dehydrate(queryClient),
		groupId,
	}
}

export default function GroupSettingsRoute({
	loaderData: { queryClient, groupId },
}: Route.ComponentProps) {
	return (
		<HydrationBoundary state={queryClient}>
			<GroupSettingsPage groupId={groupId} />
		</HydrationBoundary>
	)
}
