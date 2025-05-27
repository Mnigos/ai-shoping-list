'use client'

import { type FormEvent, useRef } from 'react'
import { useShoppingListStore } from '~/stores/shopping-list.store'
import { cn } from '~/utils/cn'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Input } from './ui/input'
import { Label } from './ui/label'

export function ShoppingList() {
	const formRef = useRef<HTMLFormElement>(null)
	const items = useShoppingListStore(state =>
		state.items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
	)
	const addItem = useShoppingListStore(state => state.addItem)
	const checkItem = useShoppingListStore(state => state.checkItem)
	const updateItemAmount = useShoppingListStore(state => state.updateItemAmount)
	const sortItems = useShoppingListStore(state => state.sortItems)

	function handleSubmit(event: FormEvent) {
		event.preventDefault()

		const formData = new FormData(event.target as HTMLFormElement)
		const name = formData.get('name') as string
		const amount = Number(formData.get('amount')) ?? 1

		addItem({ name, amount, isChecked: false })
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
					<Button type="submit">Add</Button>
					<Button type="button" variant="outline" onClick={sortItems}>
						Sort
					</Button>
				</form>

				<ul className="flex flex-col gap-2">
					{items.map(item => (
						<li
							key={item.id}
							className={cn(
								'flex items-center gap-2 rounded-md bg-stone-900 px-3 py-2 transition-opacity',
								item.isChecked ? 'opacity-50' : 'opacity-100',
							)}
						>
							<Checkbox
								id={item.id}
								checked={item.isChecked}
								onCheckedChange={() => checkItem(item.id)}
							/>
							<Label
								htmlFor={item.id}
								className={cn(
									'flex-1 text-md transition-all duration-300',
									item.isChecked && 'line-through',
								)}
							>
								{item.name}
							</Label>
							<Input
								type="number"
								value={item.amount}
								onChange={e =>
									updateItemAmount(item.id, Number(e.target.value) || 1)
								}
								min="1"
								className="h-8 w-16 text-sm"
							/>
						</li>
					))}
				</ul>
			</div>
		</section>
	)
}
