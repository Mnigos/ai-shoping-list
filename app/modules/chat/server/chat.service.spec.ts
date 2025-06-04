import { vi } from 'vitest'
import type { ProtectedContext } from '~/lib/trpc/t'
import { type AssistantInput, ChatService } from './chat.service'

// Mock the AI SDK modules
vi.mock('@ai-sdk/google', () => ({
	google: vi.fn(() => 'mocked-model'),
}))

const mockStreamObject = vi.hoisted(() => vi.fn())
vi.mock('ai', () => ({
	streamObject: mockStreamObject,
}))

const mockPrisma = {
	shoppingListItem: {
		findMany: vi.fn(),
	},
}

const mockUser = {
	id: 'test-user-id',
	name: 'Test User',
	email: 'test@example.com',
	emailVerified: true,
	createdAt: new Date(),
	updatedAt: new Date(),
	image: null,
	isAnonymous: false,
}

const mockContext: ProtectedContext = {
	user: mockUser,
	prisma: mockPrisma as any,
	env: {} as any,
}

const userId = mockUser.id
const testPrompt = 'Add 3 apples and 2 bananas'

describe('ChatService', () => {
	let service: ChatService

	beforeEach(() => {
		vi.clearAllMocks()
		service = new ChatService(mockContext)
	})

	describe('assistant', () => {
		const mockShoppingItems = [
			{
				id: 'item-1',
				name: 'milk',
				amount: 2,
				userId,
				isCompleted: false,
				createdAt: new Date('2023-01-02'),
			},
			{
				id: 'item-2',
				name: 'bread',
				amount: 1,
				userId,
				isCompleted: true,
				createdAt: new Date('2023-01-01'),
			},
		]

		const baseInput: AssistantInput = {
			prompt: testPrompt,
			recentMessages: [],
		}

		async function* createMockAsyncGenerator(chunks: any[]) {
			for (const chunk of chunks) {
				yield chunk
			}
		}

		test('should fetch current shopping list items and stream AI responses', async () => {
			const mockChunks = [
				{ actions: [{ action: 'add', name: 'apples', amount: 3 }] },
				{ actions: [{ action: 'add', name: 'bananas', amount: 2 }] },
			]

			mockPrisma.shoppingListItem.findMany.mockResolvedValue(mockShoppingItems)
			mockStreamObject.mockReturnValue({
				partialObjectStream: createMockAsyncGenerator(mockChunks),
			})

			const chunks = []
			for await (const chunk of service.assistant(baseInput)) {
				chunks.push(chunk)
			}

			expect(mockPrisma.shoppingListItem.findMany).toHaveBeenCalledWith({
				where: { userId },
				orderBy: { createdAt: 'desc' },
			})
			expect(chunks).toEqual(mockChunks)
		})

		test('should handle empty shopping list', async () => {
			const mockChunks = [
				{
					actions: [{ action: 'add', name: 'first-item', amount: 1 }],
					message: 'Added first item to your shopping list',
				},
			]

			mockPrisma.shoppingListItem.findMany.mockResolvedValue([])
			mockStreamObject.mockReturnValue({
				partialObjectStream: createMockAsyncGenerator(mockChunks),
			})

			const chunks = []
			for await (const chunk of service.assistant(baseInput)) {
				chunks.push(chunk)
			}

			expect(chunks).toEqual(mockChunks)
		})

		test('should include recent messages in conversation history', async () => {
			const recentMessages = [
				{
					role: 'user' as const,
					content: 'What do I have on my list?',
					createdAt: new Date('2023-01-01'),
				},
				{
					role: 'assistant' as const,
					content: 'You have milk and bread on your list.',
					createdAt: new Date('2023-01-02'),
				},
			]

			const inputWithMessages: AssistantInput = {
				prompt: testPrompt,
				recentMessages,
			}

			const mockChunks = [
				{ actions: [{ action: 'add', name: 'coffee', amount: 1 }] },
			]

			mockPrisma.shoppingListItem.findMany.mockResolvedValue(mockShoppingItems)
			mockStreamObject.mockReturnValue({
				partialObjectStream: createMockAsyncGenerator(mockChunks),
			})

			const chunks = []
			for await (const chunk of service.assistant(inputWithMessages)) {
				chunks.push(chunk)
			}

			expect(mockStreamObject).toHaveBeenCalledWith(
				expect.objectContaining({
					prompt: expect.stringContaining('Recent conversation:'),
				}),
			)
			expect(chunks).toEqual(mockChunks)
		})

		test('should format current shopping list correctly', async () => {
			const mockChunks = [{ actions: [] }]

			mockPrisma.shoppingListItem.findMany.mockResolvedValue(mockShoppingItems)
			mockStreamObject.mockReturnValue({
				partialObjectStream: createMockAsyncGenerator(mockChunks),
			})

			const chunks = []
			for await (const chunk of service.assistant(baseInput)) {
				chunks.push(chunk)
			}

			const callArgs = mockStreamObject.mock.calls[0][0]
			expect(callArgs.prompt).toContain('- milk: 2')
			expect(callArgs.prompt).toContain('- bread: 1 (completed)')
		})

		test.each([
			{
				description: 'should handle prompts with special characters',
				prompt: 'Add 2 café ☕ and 1 croissant 🥐',
			},
			{
				description: 'should handle very long prompts',
				prompt: 'A'.repeat(1000),
			},
			{
				description: 'should handle empty prompts',
				prompt: '',
			},
		])('$description', async ({ prompt }) => {
			const input: AssistantInput = { prompt, recentMessages: [] }
			const mockChunks = [{ actions: [] }]

			mockPrisma.shoppingListItem.findMany.mockResolvedValue([])
			mockStreamObject.mockReturnValue({
				partialObjectStream: createMockAsyncGenerator(mockChunks),
			})

			const chunks = []
			for await (const chunk of service.assistant(input)) {
				chunks.push(chunk)
			}

			expect(chunks).toEqual(mockChunks)
		})

		test('should call streamObject with correct parameters', async () => {
			const mockChunks = [{ actions: [] }]

			mockPrisma.shoppingListItem.findMany.mockResolvedValue([])
			mockStreamObject.mockReturnValue({
				partialObjectStream: createMockAsyncGenerator(mockChunks),
			})

			const chunks = []
			for await (const chunk of service.assistant(baseInput)) {
				chunks.push(chunk)
			}

			expect(mockStreamObject).toHaveBeenCalledWith({
				model: 'mocked-model',
				schema: expect.objectContaining({
					_def: expect.objectContaining({
						typeName: 'ZodObject',
					}),
				}),
				prompt: expect.stringContaining('You are a helpful assistant'),
			})
		})

		test('should handle database errors gracefully', async () => {
			const dbError = new Error('Database connection failed')
			mockPrisma.shoppingListItem.findMany.mockRejectedValue(dbError)

			await expect(async () => {
				const generator = service.assistant(baseInput)
				await generator.next()
			}).rejects.toThrow('Database connection failed')
		})

		test('should handle AI streaming errors', async () => {
			const aiError = new Error('AI service unavailable')

			mockPrisma.shoppingListItem.findMany.mockResolvedValue([])
			mockStreamObject.mockReturnValue({
				partialObjectStream: (async function* () {
					yield null
					throw aiError
				})(),
			})

			await expect(async () => {
				const chunks = []
				for await (const chunk of service.assistant(baseInput)) {
					chunks.push(chunk)
				}
			}).rejects.toThrow('AI service unavailable')
		})

		test('should include user prompt in the final prompt', async () => {
			const customPrompt = 'Remove all the fruits from my list'
			const input: AssistantInput = { prompt: customPrompt, recentMessages: [] }
			const mockChunks = [{ actions: [] }]

			mockPrisma.shoppingListItem.findMany.mockResolvedValue([])
			mockStreamObject.mockReturnValue({
				partialObjectStream: createMockAsyncGenerator(mockChunks),
			})

			const chunks = []
			for await (const chunk of service.assistant(input)) {
				chunks.push(chunk)
			}

			const callArgs = mockStreamObject.mock.calls[0][0]
			expect(callArgs.prompt).toContain(`Current user prompt: ${customPrompt}`)
		})

		test('should handle multiple recent messages', async () => {
			const manyMessages = Array.from({ length: 50 }, (_, i) => ({
				role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
				content: `Message ${i}`,
				createdAt: new Date(2023, 0, i + 1),
			}))

			const input: AssistantInput = {
				prompt: 'test prompt',
				recentMessages: manyMessages,
			}

			const mockChunks = [{ actions: [] }]

			mockPrisma.shoppingListItem.findMany.mockResolvedValue([])
			mockStreamObject.mockReturnValue({
				partialObjectStream: (async function* () {
					yield mockChunks[0]
				})(),
			})

			const chunks = []
			for await (const chunk of service.assistant(input)) {
				chunks.push(chunk)
			}

			expect(chunks).toEqual(mockChunks)
			const callArgs = mockStreamObject.mock.calls[0][0]
			expect(callArgs.prompt).toContain('Recent conversation:')
		})
	})

	describe('edge cases and performance', () => {
		test('should handle large number of shopping list items', async () => {
			const largeItemList = Array.from({ length: 1000 }, (_, i) => ({
				id: `item-${i}`,
				name: `Item ${i}`,
				amount: i + 1,
				userId,
				isCompleted: i % 2 === 0,
				createdAt: new Date(2023, 0, i + 1),
			}))

			const mockChunks = [{ actions: [] }]

			mockPrisma.shoppingListItem.findMany.mockResolvedValue(largeItemList)
			mockStreamObject.mockReturnValue({
				partialObjectStream: (async function* () {
					yield mockChunks[0]
				})(),
			})

			const chunks = []
			for await (const chunk of service.assistant({
				prompt: 'test',
				recentMessages: [],
			})) {
				chunks.push(chunk)
			}

			expect(chunks).toEqual(mockChunks)
			expect(mockPrisma.shoppingListItem.findMany).toHaveBeenCalledOnce()
		})
	})
})
