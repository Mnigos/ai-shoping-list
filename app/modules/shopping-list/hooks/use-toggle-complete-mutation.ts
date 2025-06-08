import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router'
import { useTRPC } from '~/lib/trpc/react'

export function useToggleCompleteMutation() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	// !REFACTOR: create useActiveGroupId hook
	const { id } = useParams()

	if (!id) throw new Error('GroupId not found')

	return useMutation(
		trpc.shoppingList.toggleComplete.mutationOptions({
			onSuccess: () => {
				// Invalidate the shopping list query for the active group
				if (id) {
					queryClient.invalidateQueries({
						queryKey: trpc.shoppingList.getItems.queryKey({
							groupId: id,
						}),
					})
				}
			},
		}),
	)
}
