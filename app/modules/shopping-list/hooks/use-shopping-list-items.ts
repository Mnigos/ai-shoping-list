import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '~/lib/trpc/react'

export function useShoppingListItems(groupId: string) {
	const trpc = useTRPC()

	return useQuery({
		...trpc.shoppingList.getItems.queryOptions({
			groupId,
		}),
		enabled: !!groupId,
	})
}
