import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '~/lib/trpc/react'
import type { DeleteGroupInput } from '../server/group.service'
import {
	type GroupWithRole,
	createGroupOptimisticErrorHandler,
	createGroupOptimisticSettledHandler,
	createGroupOptimisticUpdate,
} from './helpers/group-optimistic-updates'

interface DeleteGroupContext {
	previousGroups: GroupWithRole[]
	deletedGroup: GroupWithRole | undefined
}

export function useDeleteGroupMutation() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const queryKey = trpc.group.getMyGroups.queryKey()

	const optimisticUpdate = createGroupOptimisticUpdate<
		DeleteGroupInput,
		DeleteGroupContext
	>({
		queryClient,
		queryKey,
		updateFn: (groups, variables) => {
			return groups.filter(group => group.id !== variables.id)
		},
		createContext: (previousGroups, variables) => {
			const deletedGroup = previousGroups.find(
				group => group.id === variables.id,
			)
			return { previousGroups, deletedGroup }
		},
	})

	return useMutation(
		trpc.group.deleteGroup.mutationOptions({
			onMutate: optimisticUpdate,
			onError: createGroupOptimisticErrorHandler<DeleteGroupContext>(
				queryClient,
				queryKey,
			),
			onSettled: createGroupOptimisticSettledHandler(queryClient, queryKey),
		}),
	)
}
