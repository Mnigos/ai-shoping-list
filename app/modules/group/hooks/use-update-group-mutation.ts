import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '~/lib/trpc/react'
import type { UpdateGroupInput } from '../server/group.service'
import {
	type GroupWithRole,
	createGroupOptimisticErrorHandler,
	createGroupOptimisticSettledHandler,
	createGroupOptimisticUpdate,
} from './helpers/group-optimistic-updates'

interface UpdateGroupContext {
	previousGroups: GroupWithRole[]
}

export function useUpdateGroupMutation() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const queryKey = trpc.group.getMyGroups.queryKey()

	const optimisticUpdate = createGroupOptimisticUpdate<
		UpdateGroupInput,
		UpdateGroupContext
	>({
		queryClient,
		queryKey,
		updateFn: (groups, variables) => {
			return groups.map(group =>
				group.id === variables.id
					? {
							...group,
							...(variables.name && { name: variables.name }),
							...(variables.description !== undefined && {
								description: variables.description,
							}),
						}
					: group,
			)
		},
	})

	return useMutation(
		trpc.group.updateGroup.mutationOptions({
			onMutate: optimisticUpdate,
			onError: createGroupOptimisticErrorHandler<UpdateGroupContext>(
				queryClient,
				queryKey,
			),
			onSuccess: data => {
				// Replace with the updated group from server
				queryClient.setQueryData<GroupWithRole[]>(
					queryKey,
					old => old?.map(group => (group.id === data.id ? data : group)) ?? [],
				)
			},
			onSettled: createGroupOptimisticSettledHandler(queryClient, queryKey),
		}),
	)
}
