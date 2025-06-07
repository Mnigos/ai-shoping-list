import type { ShoppingListItem as ShoppingListItemType } from '@prisma/client'
import debounce from 'lodash/debounce'
import {
	type ChangeEvent,
	type ComponentProps,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react'
import { useActiveGroupData } from '~/modules/group/hooks/use-active-group'
import { Checkbox } from '~/shared/components/ui/checkbox'
import { Input } from '~/shared/components/ui/input'
import { Label } from '~/shared/components/ui/label'
import { cn } from '~/shared/utils/cn'
import { useToggleCompleteMutation } from '../hooks/use-toggle-complete-mutation'
import { useUpdateItemMutation } from '../hooks/use-update-item-mutation'

type ShoppingListItemWithCreator = ShoppingListItemType & {
	createdBy: {
		id: string
		name: string
	}
}

interface ShoppingListItemProps extends ComponentProps<'li'> {
	item: ShoppingListItemWithCreator
}

export function ShoppingListItem({
	item,
	className,
	...props
}: Readonly<ShoppingListItemProps>) {
	const updateItemMutation = useUpdateItemMutation()
	const toggleCompleteMutation = useToggleCompleteMutation()
	const { activeGroupId } = useActiveGroupData()
	const [localAmount, setLocalAmount] = useState(item.amount)

	const debouncedUpdateRef = useRef(
		debounce((id: string, amount: number, groupId: string) => {
			updateItemMutation.mutate({ id, amount, groupId })
		}, 500),
	)

	useEffect(() => {
		if (!updateItemMutation.isPending) setLocalAmount(item.amount)
	}, [item.amount, updateItemMutation.isPending])

	useEffect(
		() => () => {
			debouncedUpdateRef.current.cancel()
		},
		[],
	)

	const handleAmountChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			if (!activeGroupId) return

			const newAmount = Number(e.target.value) || 1
			setLocalAmount(newAmount)
			debouncedUpdateRef.current(item.id, newAmount, activeGroupId)
		},
		[item.id, activeGroupId],
	)

	const handleToggleComplete = useCallback(() => {
		if (!activeGroupId) return
		toggleCompleteMutation.mutate({ id: item.id, groupId: activeGroupId })
	}, [item.id, activeGroupId, toggleCompleteMutation])

	return (
		<li
			{...props}
			className={cn(
				'flex items-center gap-2 rounded-md bg-stone-900 px-3 py-2 transition-opacity',
				item.isCompleted ? 'opacity-50' : 'opacity-100',
				className,
			)}
		>
			<Checkbox
				id={item.id}
				checked={item.isCompleted}
				onCheckedChange={handleToggleComplete}
			/>
			<Label
				htmlFor={item.id}
				className={cn(
					'flex-1 text-md transition-all duration-300',
					item.isCompleted && 'line-through',
				)}
			>
				{item.name}
			</Label>
			<Input
				type="number"
				value={localAmount}
				onChange={handleAmountChange}
				min="1"
				className="h-8 w-16 text-sm"
				disabled={!activeGroupId}
			/>
		</li>
	)
}
