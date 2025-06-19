import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '~/lib/trpc/react'
import { createTRPC } from '~/lib/trpc/server'
import { InvitePage } from '~/modules/group/components/pages/invite.page'
import type { Route } from './+types/invite.$code.route'

export async function loader(loaderArgs: Route.LoaderArgs) {
	const trpc = await createTRPC(loaderArgs)
	const queryClient = getQueryClient()
	const { code } = loaderArgs.params

	await queryClient.prefetchQuery(
		trpc.group.validateInviteCode.queryOptions({ inviteCode: code }),
	)

	return {
		queryClient: dehydrate(queryClient),
	}
}

export default function InviteRoute({
	params: { code },
	loaderData: { queryClient },
}: Route.ComponentProps) {
	return (
		<HydrationBoundary state={queryClient}>
			<InvitePage code={code} />
		</HydrationBoundary>
	)
}
