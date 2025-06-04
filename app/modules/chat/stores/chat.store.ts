import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface Message {
	id: string
	content: string
	role: 'user' | 'assistant'
	createdAt: Date
}

interface ChatStore {
	messages: Message[]
	addMessage: (message: Message) => void
	clearMessages: () => void
}

export const useChatStore = create<ChatStore>()(
	persist(
		set => ({
			messages: [],
			addMessage: message =>
				set(state => ({
					messages: [...state.messages, message],
				})),
			clearMessages: () => set({ messages: [] }),
		}),
		{
			name: 'chat',
			storage: createJSONStorage(() => localStorage),
			onRehydrateStorage: () => state => {
				if (state) {
					// Convert createdAt strings back to Date objects
					state.messages = state.messages.map(item => ({
						...item,
						createdAt: new Date(item.createdAt),
					}))

					if (state.messages.length === 0)
						state.messages.push({
							id: crypto.randomUUID(),
							content:
								"Hi! I'm here to help you manage your shopping list. What would you like to add to your shopping list today?",
							role: 'assistant',
							createdAt: new Date(),
						})
				}
			},
		},
	),
)
