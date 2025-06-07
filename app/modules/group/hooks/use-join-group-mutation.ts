import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '~/lib/trpc/react'
import {
	type GroupWithRole,
	createGroupOptimisticSettledHandler,
} from './helpers/group-optimistic-updates'

export function useJoinGroupMutation() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const queryKey = trpc.group.getMyGroups.queryKey()

	return useMutation(
		trpc.group.joinViaCode.mutationOptions({
			onSuccess: data => {
				// Add the new group to the groups list
				queryClient.setQueryData<GroupWithRole[]>(queryKey, old =>
					old ? [data, ...old] : [data],
				)
			},
			onSettled: createGroupOptimisticSettledHandler(queryClient, queryKey),
		}),
	)
}

/**
 * Hook for validating invite codes without joining
 */
export function useValidateInviteCodeQuery(inviteCode: string | null) {
	const trpc = useTRPC()

	return useQuery({
		...trpc.group.validateInviteCode.queryOptions({
			inviteCode: inviteCode ?? '',
		}),
		enabled: !!inviteCode && inviteCode.length > 0,
		retry: false,
		staleTime: 0, // Always validate fresh
	})
}
