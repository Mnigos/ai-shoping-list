import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '~/lib/trpc/react'

export function useGenerateInviteLinkMutation() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	return useMutation(
		trpc.group.generateInviteLink.mutationOptions({
			onSuccess: () => {
				// No need to invalidate queries as this doesn't affect group data
				// The link is generated on-demand and not stored
			},
		}),
	)
}
