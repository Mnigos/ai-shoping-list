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
import { Checkbox } from '~/shared/components/ui/checkbox'
import { Input } from '~/shared/components/ui/input'
import { Label } from '~/shared/components/ui/label'
import { useToggleCompleteMutation } from '~/shared/hooks/use-toggle-complete-mutation'
import { useUpdateItemMutation } from '~/shared/hooks/use-update-item-mutation'
import { cn } from '~/shared/utils/cn'

interface ShoppingListItemProps extends ComponentProps<'li'> {
	item: ShoppingListItemType
}

export function ShoppingListItem({
	item,
	className,
	...props
}: Readonly<ShoppingListItemProps>) {
	const updateItemMutation = useUpdateItemMutation()
	const toggleCompleteMutation = useToggleCompleteMutation()
	const [localAmount, setLocalAmount] = useState(item.amount)

	const debouncedUpdateRef = useRef(
		debounce((id: string, amount: number) => {
			updateItemMutation.mutate({ id, amount })
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
			const newAmount = Number(e.target.value) || 1
			setLocalAmount(newAmount)
			debouncedUpdateRef.current(item.id, newAmount)
		},
		[item.id],
	)

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
				onCheckedChange={() => toggleCompleteMutation.mutate({ id: item.id })}
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
			/>
		</li>
	)
}
