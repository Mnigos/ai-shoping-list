import z from 'zod'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export const AddToShoppingListSchema = z.object({
	name: z.string().describe('The name of the item'),
	amount: z.number().describe('The amount of the item'),
})
type AddToShoppingListSchema = z.infer<typeof AddToShoppingListSchema>

interface ShoppingListItem extends AddToShoppingListSchema {
	id: string
	isCompleted: boolean
	createdAt: Date
}

interface ShoppingListStore {
	items: ShoppingListItem[]
	addItem: (item: AddToShoppingListSchema) => void
	addOrUpdateItem: (item: AddToShoppingListSchema) => void
	removeItem: (item: ShoppingListItem) => void
	removeItemByName: (name: string) => void
	updateItem: (item: ShoppingListItem) => void
	updateItemByName: (
		name: string,
		updates: Partial<AddToShoppingListSchema>,
	) => void
	updateItemAmount: (id: string, amount: number) => void
	reduceItemAmount: (name: string, reduceBy: number) => void
	completeItem: (id: string) => void
	completeItemByName: (name: string) => void
}

export const useShoppingListStore = create<ShoppingListStore>()(
	persist(
		set => ({
			items: [],
			addItem: item =>
				set(state => ({
					items: [
						...state.items,
						{
							...item,
							id: crypto.randomUUID(),
							createdAt: new Date(),
							isCompleted: false,
						},
					],
				})),
			addOrUpdateItem: item =>
				set(state => {
					const existingItemIndex = state.items.findIndex(
						i => i.name.toLowerCase() === item.name.toLowerCase(),
					)

					if (existingItemIndex !== -1) {
						const updatedItems = [...state.items]
						updatedItems[existingItemIndex] = {
							...updatedItems[existingItemIndex],
							amount: updatedItems[existingItemIndex].amount + item.amount,
						}
						return { items: updatedItems }
					}

					return {
						items: [
							...state.items,
							{
								...item,
								id: crypto.randomUUID(),
								createdAt: new Date(),
								isCompleted: false,
							},
						],
					}
				}),
			removeItem: item =>
				set(state => ({
					items: state.items.filter(i => i.name !== item.name),
				})),
			removeItemByName: name =>
				set(state => ({
					items: state.items.filter(
						i => i.name.toLowerCase() !== name.toLowerCase(),
					),
				})),
			updateItem: item =>
				set(state => ({
					items: state.items.map(i => (i.name === item.name ? item : i)),
				})),
			updateItemByName: (name, updates) =>
				set(state => ({
					items: state.items.map(i =>
						i.name.toLowerCase() === name.toLowerCase()
							? { ...i, ...updates }
							: i,
					),
				})),
			updateItemAmount: (id, amount) =>
				set(state => ({
					items: state.items.map(i => (i.id === id ? { ...i, amount } : i)),
				})),
			reduceItemAmount: (name, reduceBy) =>
				set(state => ({
					items: state.items
						.map(i =>
							i.name.toLowerCase() === name.toLowerCase()
								? { ...i, amount: Math.max(0, i.amount - reduceBy) }
								: i,
						)
						.filter(i => i.amount > 0),
				})),
			completeItem: id =>
				set(state => ({
					items: state.items.map(i =>
						i.id === id ? { ...i, isCompleted: !i.isCompleted } : i,
					),
				})),
			completeItemByName: name =>
				set(state => ({
					items: state.items.map(i =>
						i.name.toLowerCase() === name.toLowerCase()
							? { ...i, isCompleted: !i.isCompleted }
							: i,
					),
				})),
		}),
		{
			name: 'shopping-list',
			storage: createJSONStorage(() => localStorage),
			onRehydrateStorage: () => state => {
				if (state) {
					// Convert createdAt strings back to Date objects and handle isChecked -> isCompleted migration
					state.items = state.items.map(item => ({
						...item,
						createdAt: new Date(item.createdAt),
						// Handle migration from isChecked to isCompleted
						isCompleted:
							item.isCompleted ??
							(item as { isChecked?: boolean }).isChecked ??
							false,
					}))
				}
			},
		},
	),
)
