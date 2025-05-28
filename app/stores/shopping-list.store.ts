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
	isChecked: boolean
	createdAt: Date
}

interface ShoppingListStore {
	items: ShoppingListItem[]
	addItem: (item: AddToShoppingListSchema) => void
	addOrUpdateItem: (item: AddToShoppingListSchema) => void
	removeItem: (item: ShoppingListItem) => void
	updateItem: (item: ShoppingListItem) => void
	updateItemAmount: (id: string, amount: number) => void
	checkItem: (id: string) => void
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
							isChecked: false,
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
								isChecked: false,
							},
						],
					}
				}),
			removeItem: item =>
				set(state => ({
					items: state.items.filter(i => i.name !== item.name),
				})),
			updateItem: item =>
				set(state => ({
					items: state.items.map(i => (i.name === item.name ? item : i)),
				})),
			updateItemAmount: (id, amount) =>
				set(state => ({
					items: state.items.map(i => (i.id === id ? { ...i, amount } : i)),
				})),
			checkItem: id =>
				set(state => ({
					items: state.items.map(i =>
						i.id === id ? { ...i, isChecked: !i.isChecked } : i,
					),
				})),
		}),
		{
			name: 'shopping-list',
			storage: createJSONStorage(() => localStorage),
			onRehydrateStorage: () => state => {
				if (state) {
					// Convert createdAt strings back to Date objects
					state.items = state.items.map(item => ({
						...item,
						createdAt: new Date(item.createdAt),
					}))
				}
			},
		},
	),
)
