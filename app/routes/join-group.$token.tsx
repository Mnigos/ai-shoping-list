import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '~/lib/trpc/react'
import { createTRPC } from '~/lib/trpc/server'
import { JoinGroupPage } from '~/modules/group/components/join-group-page'
import type { Route } from './+types/join-group.$token'

export function meta({ params }: Route.MetaArgs) {
	return [
		{ title: 'Join Group - AI Shopping List' },
		{
			name: 'description',
			content: 'Join a shopping list group and start collaborating',
		},
	]
}

export async function loader(loaderArgs: Route.LoaderArgs) {
	const queryClient = getQueryClient()
	const trpc = await createTRPC(loaderArgs)
	const { token } = loaderArgs.params

	// Pre-validate the invite token if possible
	try {
		await queryClient.prefetchQuery(
			trpc.group.validateInviteToken.queryOptions({ token }),
		)
	} catch (error) {
		// If validation fails, we'll handle it in the component
		console.warn('Failed to prefetch invite token validation:', error)
	}

	return {
		queryClient: dehydrate(queryClient),
		token,
	}
}

export default function JoinGroupRoute({
	loaderData: { queryClient, token },
}: Route.ComponentProps) {
	return (
		<HydrationBoundary state={queryClient}>
			<JoinGroupPage token={token} />
		</HydrationBoundary>
	)
}
