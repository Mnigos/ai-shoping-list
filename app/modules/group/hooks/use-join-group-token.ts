import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '~/lib/trpc/react'
import {
	type GroupWithRole,
	createGroupOptimisticSettledHandler,
} from './helpers/group-optimistic-updates'

/**
 * Hook for validating invite tokens without joining
 */
export function useValidateInviteTokenQuery(token: string | null) {
	const trpc = useTRPC()

	return useQuery({
		...trpc.group.validateInviteToken.queryOptions({
			token: token ?? '',
		}),
		enabled: !!token && token.length > 0,
		retry: false,
		staleTime: 0, // Always validate fresh
	})
}

/**
 * Hook for joining groups via invite token
 */
export function useJoinViaTokenMutation() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const queryKey = trpc.group.getMyGroups.queryKey()

	return useMutation(
		trpc.group.joinViaToken.mutationOptions({
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
