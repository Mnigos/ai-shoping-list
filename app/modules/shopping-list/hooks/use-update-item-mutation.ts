import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '~/lib/trpc/react'
import { useActiveGroupData } from '~/modules/group/hooks/use-active-group'

export function useUpdateItemMutation() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const { activeGroupId } = useActiveGroupData()

	return useMutation(
		trpc.shoppingList.updateItem.mutationOptions({
			onSuccess: () => {
				// Invalidate the shopping list query for the active group
				if (activeGroupId) {
					queryClient.invalidateQueries({
						queryKey: trpc.shoppingList.getItems.queryKey({
							groupId: activeGroupId,
						}),
					})
				}
			},
		}),
	)
}
