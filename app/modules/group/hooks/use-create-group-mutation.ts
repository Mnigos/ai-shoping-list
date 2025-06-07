import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '~/lib/trpc/react'
import type { CreateGroupInput } from '../server/group.service'
import {
	type GroupWithRole,
	createGroupOptimisticUpdate,
} from './helpers/group-optimistic-updates'

interface CreateGroupContext {
	previousGroups: GroupWithRole[]
	optimisticGroup: GroupWithRole
}

const createOptimisticGroup = (variables: CreateGroupInput): GroupWithRole => ({
	id: `temp-${crypto.randomUUID()}`,
	name: variables.name,
	description: variables.description ?? null,
	inviteCode: `temp-${crypto.randomUUID()}`,
	isPersonal: false,
	createdAt: new Date(),
	updatedAt: new Date(),
	myRole: 'ADMIN',
})

export function useCreateGroupMutation() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const queryKey = trpc.group.getMyGroups.queryKey()

	const optimisticUpdate = createGroupOptimisticUpdate<
		CreateGroupInput,
		CreateGroupContext
	>({
		queryClient,
		queryKey,
		updateFn: (groups, variables) => {
			const optimisticGroup = createOptimisticGroup(variables)
			return [optimisticGroup, ...groups]
		},
		createContext: (previousGroups, variables) => {
			const optimisticGroup = createOptimisticGroup(variables)
			return { previousGroups, optimisticGroup }
		},
	})

	return useMutation(
		trpc.group.createGroup.mutationOptions({
			onSuccess: data => {
				// Invalidate and refetch the groups query to get fresh data
				queryClient.invalidateQueries({ queryKey })
			},
		}),
	)
}
