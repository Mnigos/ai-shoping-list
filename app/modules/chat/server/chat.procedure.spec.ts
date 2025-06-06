import { vi } from 'vitest'

const mockChatService = vi.hoisted(() =>
	vi.fn().mockImplementation(() => ({
		assistant: vi.fn(),
	})),
)

// Mock the ChatService directly
vi.mock('./chat.service', () => ({
	ChatService: mockChatService,
}))

import { chatProcedure } from './chat.procedure'

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

const mockPrisma = {
	shoppingListItem: {
		findMany: vi.fn(),
	},
}

const mockContext = {
	user: mockUser,
	prisma: mockPrisma,
	env: {},
}

const mockNext = vi.fn()

describe('ChatProcedure', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockNext.mockResolvedValue({ success: true })
	})

	test('should add service to context', async () => {
		// Get the last middleware (ChatService middleware)
		const middlewares = chatProcedure._def.middlewares
		const chatServiceMiddleware = middlewares[middlewares.length - 1]

		await chatServiceMiddleware?.({
			ctx: mockContext,
			type: 'query',
			path: 'test',
			input: {},
			getRawInput: vi.fn(),
			meta: {},
			signal: undefined,
			next: mockNext,
		})

		expect(mockChatService).toHaveBeenCalledWith(mockContext)
		expect(mockNext).toHaveBeenCalledWith({
			ctx: {
				...mockContext,
				service: expect.any(Object),
			},
		})
	})

	test('should pass through original context properties', async () => {
		// Get the last middleware (ChatService middleware)
		const middlewares = chatProcedure._def.middlewares
		const chatServiceMiddleware = middlewares[middlewares.length - 1]

		await chatServiceMiddleware?.({
			ctx: mockContext,
			type: 'query',
			path: 'test',
			input: {},
			getRawInput: vi.fn(),
			meta: {},
			signal: undefined,
			next: mockNext,
		})

		const callArgs = mockNext.mock.calls[0][0]
		expect(callArgs.ctx.user).toEqual(mockUser)
		expect(callArgs.ctx.prisma).toEqual(mockPrisma)
		expect(callArgs.ctx.env).toEqual({})
		expect(callArgs.ctx.service).toBeDefined()
	})

	test('should handle next function errors', async () => {
		const error = new Error('Next function failed')
		mockNext.mockRejectedValue(error)

		// Get the last middleware (ChatService middleware)
		const middlewares = chatProcedure._def.middlewares
		const chatServiceMiddleware = middlewares[middlewares.length - 1]

		await expect(
			chatServiceMiddleware?.({
				ctx: mockContext,
				type: 'query',
				path: 'test',
				input: {},
				getRawInput: vi.fn(),
				meta: {},
				signal: undefined,
				next: mockNext,
			}),
		).rejects.toThrow('Next function failed')
	})

	test('should create new service instance for each call', async () => {
		// Get the last middleware (ChatService middleware)
		const middlewares = chatProcedure._def.middlewares
		const chatServiceMiddleware = middlewares[middlewares.length - 1]

		const middlewareArgs = {
			ctx: mockContext,
			type: 'query' as const,
			path: 'test',
			input: {},
			getRawInput: vi.fn(),
			meta: {},
			signal: undefined,
			next: mockNext,
		}

		await chatServiceMiddleware?.(middlewareArgs)
		await chatServiceMiddleware?.(middlewareArgs)

		expect(mockNext).toHaveBeenCalledTimes(2)
		expect(mockChatService).toHaveBeenCalledTimes(2)

		const firstCall = mockNext.mock.calls[0][0]
		const secondCall = mockNext.mock.calls[1][0]

		expect(firstCall.ctx.service).toBeDefined()
		expect(secondCall.ctx.service).toBeDefined()
		expect(firstCall.ctx.service).not.toBe(secondCall.ctx.service)
	})

	test('should integrate ChatService into context via actual chatProcedure', async () => {
		const mockInput = {}
		const mockResolver = vi.fn().mockResolvedValue({ success: true })

		const procedureWithResolver = chatProcedure.query(mockResolver)

		await procedureWithResolver({
			ctx: mockContext,
			input: mockInput,
			getRawInput: vi.fn(),
			path: 'test',
			type: 'query',
			signal: undefined,
		})

		expect(mockChatService).toHaveBeenCalledWith(mockContext)
		expect(mockResolver).toHaveBeenCalledWith(
			expect.objectContaining({
				ctx: expect.objectContaining({
					service: expect.any(Object),
				}),
			}),
		)
	})
})
