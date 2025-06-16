import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '~/lib/trpc/react'

export function useRemoveMemberMutation() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const myGroupsOverviewQueryKey = trpc.group.getMyGroupsOverview.queryKey()
	const myGroupsQueryKey = trpc.group.getMyGroups.queryKey()

	return useMutation(
		trpc.group.removeMember.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: myGroupsOverviewQueryKey })
				queryClient.invalidateQueries({ queryKey: myGroupsQueryKey })
			},
		}),
	)
}
