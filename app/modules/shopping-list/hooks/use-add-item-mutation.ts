import type { ShoppingListItem } from '@prisma/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authClient } from '~/lib/auth-client'
import { useTRPC } from '~/lib/trpc/react'
import { useActiveGroupData } from '~/modules/group/hooks/use-active-group'

type ShoppingListItemWithCreator = ShoppingListItem & {
	createdBy: {
		id: string
		name: string
	}
}

export function useAddItemMutation() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const { data } = authClient.useSession()
	const { activeGroupId } = useActiveGroupData()

	return useMutation(
		trpc.shoppingList.addItem.mutationOptions({
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
