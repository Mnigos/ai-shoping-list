import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface ShoppingListItem {
	id: string
	name: string
	amount: number
	isChecked: boolean
	createdAt: Date
}

interface ShoppingListStore {
	items: ShoppingListItem[]
	addItem: (item: Omit<ShoppingListItem, 'id' | 'createdAt'>) => void
	removeItem: (item: ShoppingListItem) => void
	updateItem: (item: ShoppingListItem) => void
	updateItemAmount: (id: string, amount: number) => void
	checkItem: (id: string) => void
	clearItems: () => void
	sortItems: () => void
}

export const useShoppingListStore = create<ShoppingListStore>()(
	persist(
		set => ({
			items: [],
			addItem: item =>
				set(state => ({
					items: [
						...state.items,
						{ ...item, id: crypto.randomUUID(), createdAt: new Date() },
					],
				})),
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
			clearItems: () => set({ items: [] }),
			sortItems: () =>
				set(state => ({
					items: state.items.sort((a, b) => {
						if (a.isChecked === b.isChecked) {
							return a.name.localeCompare(b.name)
						}
						return a.isChecked ? 1 : -1
					}),
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
