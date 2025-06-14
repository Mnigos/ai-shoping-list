import { type FormEvent, useRef } from 'react'
import { Button } from '~/shared/components/ui/button'
import { Input } from '~/shared/components/ui/input'
import { useAddItemMutation } from '../hooks/use-add-item-mutation'
import { useShoppingListItems } from '../hooks/use-shopping-list-items'
import { ShoppingListItem } from './shopping-list-item'

interface ShoppingListProps {
	groupId: string
}

export function ShoppingList({ groupId }: Readonly<ShoppingListProps>) {
	const formRef = useRef<HTMLFormElement>(null)
	const addItemMutation = useAddItemMutation()
	const { data: items = [] } = useShoppingListItems(groupId)

	function handleSubmit(event: FormEvent) {
		event.preventDefault()

		const formData = new FormData(event.target as HTMLFormElement)
		const name = formData.get('name') as string
		const amount = Number(formData.get('amount')) ?? 1

		addItemMutation.mutate({ name, amount, groupId })
		formRef.current?.reset()
	}

	return (
		<section className="flex flex-col gap-8">
			<header>
				<h1 className="font-bold text-3xl">Shopping List</h1>
			</header>

			<div className="flex flex-col gap-4">
				<form
					ref={formRef}
					className="flex items-center gap-2"
					onSubmit={handleSubmit}
				>
					<Input type="text" placeholder="Add item" name="name" required />
					<Input
						type="number"
						placeholder="Amount"
						name="amount"
						min="1"
						defaultValue="1"
						className="w-24"
					/>
					<Button type="submit" disabled={addItemMutation.isPending}>
						{addItemMutation.isPending ? 'Adding...' : 'Add'}
					</Button>
				</form>

				<ul className="flex flex-col gap-2">
					{items.length === 0 ? (
						<li className="rounded-md bg-stone-900 px-3 py-4 text-center text-stone-400">
							No items in your shopping list yet. Add some items above!
						</li>
					) : (
						items.map(item => <ShoppingListItem key={item.id} item={item} />)
					)}
				</ul>
			</div>
		</section>
	)
}
