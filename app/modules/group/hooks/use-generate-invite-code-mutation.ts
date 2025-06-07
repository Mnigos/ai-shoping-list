import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '~/lib/trpc/react'
import {
	type GroupWithRole,
	createGroupOptimisticSettledHandler,
} from './helpers/group-optimistic-updates'

export function useGenerateInviteCodeMutation() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const queryKey = trpc.group.getMyGroups.queryKey()

	return useMutation(
		trpc.group.generateInviteCode.mutationOptions({
			onSuccess: (data, variables) => {
				// Update the group with the new invite code
				queryClient.setQueryData<GroupWithRole[]>(
					queryKey,
					old =>
						old?.map(group =>
							group.id === variables.groupId
								? { ...group, inviteCode: data.inviteCode }
								: group,
						) ?? [],
				)
			},
			onSettled: createGroupOptimisticSettledHandler(queryClient, queryKey),
		}),
	)
}
