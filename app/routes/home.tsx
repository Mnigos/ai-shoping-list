import { type FormEvent, useRef } from 'react'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { useShoppingListStore } from '~/stores/shopping-list.store'
import { cn } from '~/utils/cn'

export function meta() {
	return [
		{ title: 'New React Router App' },
		{ name: 'description', content: 'Welcome to React Router!' },
	]
}

export default function Home() {
	const formRef = useRef<HTMLFormElement>(null)
	const items = useShoppingListStore(state => state.items)
	const addItem = useShoppingListStore(state => state.addItem)
	const checkItem = useShoppingListStore(state => state.checkItem)

	function handleSubmit(event: FormEvent) {
		event.preventDefault()

		const formData = new FormData(event.target as HTMLFormElement)
		const name = formData.get('name') as string

		addItem({ name, isChecked: false })
		formRef.current?.reset()
	}

	return (
		<main className="container mx-auto p-4">
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
						<Input type="text" placeholder="Add item" name="name" />
						<Button type="submit">Add</Button>
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
										'w-full text-md transition-all duration-300',
										item.isChecked && 'line-through',
									)}
								>
									{item.name}
								</Label>
							</li>
						))}
					</ul>
				</div>
			</section>
		</main>
	)
}
