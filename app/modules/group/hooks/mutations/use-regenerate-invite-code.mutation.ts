import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '~/lib/trpc/react'

export function useRegenerateInviteCodeMutation() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const queryKey = trpc.group.getGroupDetails.queryKey()

	return useMutation(
		trpc.group.regenerateInviteCode.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey })
			},
		}),
	)
}
