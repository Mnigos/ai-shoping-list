import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '~/lib/trpc/react'

export function useTransferListMutation() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	return useMutation(
		trpc.group.transferShoppingList.mutationOptions({
			onSuccess: (data, variables) => {
				// Invalidate shopping list queries for both groups affected by the transfer
				queryClient.invalidateQueries({
					queryKey: trpc.shoppingList.getItems.queryKey({
						groupId: variables.fromGroupId,
					}),
				})
				queryClient.invalidateQueries({
					queryKey: trpc.shoppingList.getItems.queryKey({
						groupId: variables.toGroupId,
					}),
				})
			},
		}),
	)
}
