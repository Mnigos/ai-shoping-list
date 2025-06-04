import { assistantBasePrompt, assistantPromptFactory } from './chat.prompts'

const mockShoppingItems = [
	{
		id: 'item-1',
		name: 'milk',
		amount: 2,
		userId: 'test-user',
		isCompleted: false,
		createdAt: new Date('2023-01-02'),
		updatedAt: new Date('2023-01-02'),
	},
	{
		id: 'item-2',
		name: 'bread',
		amount: 1,
		userId: 'test-user',
		isCompleted: true,
		createdAt: new Date('2023-01-01'),
		updatedAt: new Date('2023-01-01'),
	},
]

const mockMessages = [
	{
		role: 'user' as const,
		content: 'What do I have?',
		createdAt: new Date('2023-01-01'),
	},
	{
		role: 'assistant' as const,
		content: 'You have milk and bread.',
		createdAt: new Date('2023-01-02'),
	},
]

describe('ChatPrompts', () => {
	describe('assistantPromptFactory', () => {
		test('should include base prompt', () => {
			const result = assistantPromptFactory({
				currentItems: [],
				recentMessages: [],
				prompt: 'test prompt',
			})

			expect(result).toContain(assistantBasePrompt)
		})

		test('should include current items when present', () => {
			const result = assistantPromptFactory({
				currentItems: mockShoppingItems,
				recentMessages: [],
				prompt: 'test prompt',
			})

			expect(result).toContain('Current shopping list:')
			expect(result).toContain('- milk: 2')
			expect(result).toContain('- bread: 1 (completed)')
		})

		test('should show empty list message when no items', () => {
			const result = assistantPromptFactory({
				currentItems: [],
				recentMessages: [],
				prompt: 'test prompt',
			})

			expect(result).toContain('Current shopping list is empty.')
		})

		test('should include recent messages when present', () => {
			const result = assistantPromptFactory({
				currentItems: [],
				recentMessages: mockMessages,
				prompt: 'test prompt',
			})

			expect(result).toContain('Recent conversation:')
			expect(result).toContain('User: What do I have?')
			expect(result).toContain('Assistant: You have milk and bread.')
		})

		test('should include user prompt', () => {
			const testPrompt = 'Add 5 apples'
			const result = assistantPromptFactory({
				currentItems: [],
				recentMessages: [],
				prompt: testPrompt,
			})

			expect(result).toContain(`Current user prompt: ${testPrompt}`)
		})

		test('should handle all sections together', () => {
			const testPrompt = 'Remove bananas'
			const result = assistantPromptFactory({
				currentItems: mockShoppingItems,
				recentMessages: mockMessages,
				prompt: testPrompt,
			})

			expect(result).toContain(assistantBasePrompt)
			expect(result).toContain('Current shopping list:')
			expect(result).toContain('Recent conversation:')
			expect(result).toContain(`Current user prompt: ${testPrompt}`)
		})

		test('should handle completed items correctly', () => {
			const completedItem = {
				id: 'item-3',
				name: 'bananas',
				amount: 3,
				userId: 'test-user',
				isCompleted: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const result = assistantPromptFactory({
				currentItems: [completedItem],
				recentMessages: [],
				prompt: 'test',
			})

			expect(result).toContain('- bananas: 3 (completed)')
		})

		test('should handle incomplete items correctly', () => {
			const incompleteItem = {
				id: 'item-4',
				name: 'oranges',
				amount: 5,
				userId: 'test-user',
				isCompleted: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const result = assistantPromptFactory({
				currentItems: [incompleteItem],
				recentMessages: [],
				prompt: 'test',
			})

			expect(result).toContain('- oranges: 5')
			expect(result).not.toContain('- oranges: 5 (completed)')
		})
	})
})
