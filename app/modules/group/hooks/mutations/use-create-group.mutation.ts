import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useTRPC } from '~/lib/trpc/react'

export function useCreateGroupMutation() {
	const trpc = useTRPC()
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const myGroupsOverviewQueryKey = trpc.group.getMyGroupsOverview.queryKey()
	const myGroupsQueryKey = trpc.group.getMyGroups.queryKey()

	return useMutation(
		trpc.group.createGroup.mutationOptions({
			onSuccess: group => {
				queryClient.invalidateQueries({ queryKey: myGroupsOverviewQueryKey })
				queryClient.invalidateQueries({ queryKey: myGroupsQueryKey })
				navigate(`/groups/${group.id}`)
			},
		}),
	)
}
