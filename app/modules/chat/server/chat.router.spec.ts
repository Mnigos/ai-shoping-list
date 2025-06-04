import { vi } from 'vitest'
import { chatRouter } from './chat.router'
import { AssistantInputSchema } from './chat.service'

// Mock the ai library to prevent OpenTelemetry import issues
vi.mock('ai', () => ({
	streamObject: vi.fn(),
}))

// Mock the Google AI SDK
vi.mock('@ai-sdk/google', () => ({
	google: vi.fn(),
}))

vi.mock('./chat.procedure', () => ({
	chatProcedure: {
		input: vi.fn().mockReturnThis(),
		mutation: vi.fn().mockReturnThis(),
	},
}))

const mockService = {
	assistant: vi.fn(),
}

const mockContext = {
	service: mockService,
	user: {
		id: 'test-user-id',
		name: 'Test User',
		email: 'test@example.com',
	},
}

const mockInput = {
	prompt: 'Add 3 apples',
	recentMessages: [],
}

describe('ChatRouter', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('structure', () => {
		test('should have assistant route', () => {
			expect(chatRouter).toHaveProperty('assistant')
			expect(typeof chatRouter.assistant).toBe('object')
		})

		test('should define routes as TRPCRouterRecord', () => {
			expect(chatRouter).toBeDefined()
			expect(typeof chatRouter).toBe('object')
		})
	})

	describe('assistant route', () => {
		test('should use AssistantInputSchema for input validation', () => {
			const validInput = {
				prompt: 'test prompt',
				recentMessages: [
					{
						role: 'user' as const,
						content: 'previous message',
						createdAt: new Date(),
					},
				],
			}

			const result = AssistantInputSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		test('should handle input with empty recent messages', () => {
			const input = {
				prompt: 'test prompt',
				recentMessages: [],
			}

			const result = AssistantInputSchema.safeParse(input)
			expect(result.success).toBe(true)
		})

		test('should handle input without recentMessages field', () => {
			const input = {
				prompt: 'test prompt',
			}

			const result = AssistantInputSchema.safeParse(input)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.recentMessages).toEqual([])
			}
		})

		test('should validate prompt is required', () => {
			const input = {
				recentMessages: [],
			}

			const result = AssistantInputSchema.safeParse(input)
			expect(result.success).toBe(false)
		})

		test('should validate message structure in recentMessages', () => {
			const invalidInput = {
				prompt: 'test',
				recentMessages: [
					{
						role: 'invalid-role',
						content: 'message',
						createdAt: new Date(),
					},
				],
			}

			const result = AssistantInputSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		test('should validate message role enum', () => {
			const validUserMessage = {
				prompt: 'test',
				recentMessages: [
					{
						role: 'user' as const,
						content: 'message',
						createdAt: new Date(),
					},
				],
			}

			const validAssistantMessage = {
				prompt: 'test',
				recentMessages: [
					{
						role: 'assistant' as const,
						content: 'message',
						createdAt: new Date(),
					},
				],
			}

			expect(AssistantInputSchema.safeParse(validUserMessage).success).toBe(
				true,
			)
			expect(
				AssistantInputSchema.safeParse(validAssistantMessage).success,
			).toBe(true)
		})
	})

	describe('integration', () => {
		test('should handle empty prompt gracefully', () => {
			const input = {
				prompt: '',
				recentMessages: [],
			}

			const result = AssistantInputSchema.safeParse(input)
			expect(result.success).toBe(true)
		})

		test('should handle long prompts', () => {
			const input = {
				prompt: 'A'.repeat(10000),
				recentMessages: [],
			}

			const result = AssistantInputSchema.safeParse(input)
			expect(result.success).toBe(true)
		})

		test('should handle special characters in prompt', () => {
			const input = {
				prompt: '🍎 Add émojis & spëcial characters!',
				recentMessages: [],
			}

			const result = AssistantInputSchema.safeParse(input)
			expect(result.success).toBe(true)
		})

		test('should handle many recent messages', () => {
			const manyMessages = Array.from({ length: 100 }, (_, i) => ({
				role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
				content: `Message ${i}`,
				createdAt: new Date(2023, 0, i + 1),
			}))

			const input = {
				prompt: 'test prompt',
				recentMessages: manyMessages,
			}

			const result = AssistantInputSchema.safeParse(input)
			expect(result.success).toBe(true)
		})
	})
})
