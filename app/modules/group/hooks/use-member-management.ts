import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '~/lib/trpc/react'
import type { GetMembersInput } from '../server/group-member.service'

export function useGroupMembers(input: GetMembersInput) {
	const trpc = useTRPC()

	return useQuery(trpc.group.getMembers.queryOptions(input))
}

export function useRemoveMemberMutation() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	return useMutation(
		trpc.group.removeMember.mutationOptions({
			onSuccess: (data, variables) => {
				// Invalidate the members list for this group
				queryClient.invalidateQueries({
					queryKey: trpc.group.getMembers.queryKey({
						groupId: variables.groupId,
					}),
				})

				// Also invalidate group details to update member count
				queryClient.invalidateQueries({
					queryKey: trpc.group.getGroupDetails.queryKey({
						id: variables.groupId,
					}),
				})
			},
		}),
	)
}

export function useUpdateRoleMutation() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	return useMutation(
		trpc.group.updateRole.mutationOptions({
			onSuccess: (data, variables) => {
				// Invalidate the members list for this group to refetch with updated role
				queryClient.invalidateQueries({
					queryKey: trpc.group.getMembers.queryKey({
						groupId: variables.groupId,
					}),
				})
			},
		}),
	)
}

export function useLeaveGroupMutation() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	return useMutation(
		trpc.group.leaveGroup.mutationOptions({
			onSuccess: (data, variables) => {
				// Invalidate the user's groups list to remove the left group
				queryClient.invalidateQueries({
					queryKey: trpc.group.getMyGroups.queryKey(),
				})

				// Invalidate related queries
				queryClient.invalidateQueries({
					queryKey: trpc.group.getMembers.queryKey({
						groupId: variables.groupId,
					}),
				})
				queryClient.invalidateQueries({
					queryKey: trpc.group.getGroupDetails.queryKey({
						id: variables.groupId,
					}),
				})
			},
		}),
	)
}
