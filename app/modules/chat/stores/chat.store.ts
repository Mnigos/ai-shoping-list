import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface Message {
	id: string
	content: string
	role: 'user' | 'assistant'
	createdAt?: Date
}

interface ChatStore {
	messagesByGroup: Record<string, Message[]>
	getMessages: (groupId: string) => Message[]
	addMessage: (groupId: string, message: Message) => void
	clearMessages: (groupId: string) => void
	clearAllMessages: () => void
}

function getInitialMessage(): Message {
	return {
		id: 'initial-welcome-message',
		content:
			"Hi! I'm here to help you manage your shopping list. What would you like to add to your shopping list today?",
		role: 'assistant',
	}
}

export const useChatStore = create<ChatStore>()(
	persist(
		(set, get) => ({
			messagesByGroup: {},
			getMessages: (groupId: string) => {
				const messages = get().messagesByGroup[groupId] || []
				// If no messages exist for this group, initialize with welcome message
				if (messages.length === 0) {
					const initialMessage = getInitialMessage()
					set(state => ({
						messagesByGroup: {
							...state.messagesByGroup,
							[groupId]: [initialMessage],
						},
					}))
					return [initialMessage]
				}
				return messages
			},
			addMessage: (groupId: string, message: Message) =>
				set(state => ({
					messagesByGroup: {
						...state.messagesByGroup,
						[groupId]: [...(state.messagesByGroup[groupId] || []), message],
					},
				})),
			clearMessages: (groupId: string) =>
				set(state => ({
					messagesByGroup: {
						...state.messagesByGroup,
						[groupId]: [],
					},
				})),
			clearAllMessages: () => set({ messagesByGroup: {} }),
		}),
		{
			name: 'chat',
			storage: createJSONStorage(() => localStorage),
			onRehydrateStorage: () => state => {
				if (state) {
					// Convert createdAt strings back to Date objects for all groups
					const messagesByGroup: Record<string, Message[]> = {}
					for (const [groupId, messages] of Object.entries(
						state.messagesByGroup,
					)) {
						messagesByGroup[groupId] = messages.map(item => ({
							...item,
							createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
						}))
					}
					state.messagesByGroup = messagesByGroup
				}
			},
		},
	),
)
