import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '~/lib/trpc/react'
import { useActiveGroupData } from '~/modules/group/hooks/use-active-group'

export function useShoppingListItems() {
	const trpc = useTRPC()
	const { activeGroupId } = useActiveGroupData()

	return useQuery({
		...trpc.shoppingList.getItems.queryOptions({
			groupId: activeGroupId || '',
		}),
		enabled: !!activeGroupId,
	})
}
