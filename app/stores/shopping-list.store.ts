import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface ShoppingListItem {
	id: string
	name: string
	isChecked: boolean
}

interface ShoppingListStore {
	items: ShoppingListItem[]
	addItem: (item: Omit<ShoppingListItem, 'id'>) => void
	removeItem: (item: ShoppingListItem) => void
	updateItem: (item: ShoppingListItem) => void
	checkItem: (id: string) => void
	clearItems: () => void
}

export const useShoppingListStore = create<ShoppingListStore>()(
	persist(
		set => ({
			items: [],
			addItem: item =>
				set(state => ({
					items: [...state.items, { ...item, id: crypto.randomUUID() }],
				})),
			removeItem: item =>
				set(state => ({
					items: state.items.filter(i => i.name !== item.name),
				})),
			updateItem: item =>
				set(state => ({
					items: state.items.map(i => (i.name === item.name ? item : i)),
				})),
			checkItem: id =>
				set(state => ({
					items: state.items.map(i =>
						i.id === id ? { ...i, isChecked: !i.isChecked } : i,
					),
				})),
			clearItems: () => set({ items: [] }),
		}),
		{
			name: 'shopping-list',
			storage: createJSONStorage(() => localStorage),
		},
	),
)
