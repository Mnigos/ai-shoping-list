import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '~/lib/trpc/react'
import { createTRPC } from '~/lib/trpc/server'
import { GroupSettingsPage } from '~/modules/group/components/group-settings-page'
import type { Route } from './+types/groups.$id.settings.route'

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
	const { id } = loaderArgs.params

	try {
		await queryClient.prefetchQuery(
			trpc.group.getGroupDetails.queryOptions({ id }),
		)
	} catch (error) {
		console.error('Failed to prefetch group data:', error)
	}

	return {
		queryClient: dehydrate(queryClient),
		id,
	}
}

export default function GroupSettingsRoute({
	loaderData: { queryClient, id },
}: Route.ComponentProps) {
	return (
		<HydrationBoundary state={queryClient}>
			<GroupSettingsPage groupId={id} />
		</HydrationBoundary>
	)
}
