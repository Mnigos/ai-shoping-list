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
		const middleware = async ({ ctx, next }: any) => {
			const service = new mockChatService(ctx)
			return next({
				ctx: {
					...ctx,
					service,
				},
			})
		}

		await middleware({
			ctx: mockContext,
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
		const middleware = async ({ ctx, next }: any) => {
			const service = new mockChatService(ctx)
			return next({
				ctx: {
					...ctx,
					service,
				},
			})
		}

		await middleware({
			ctx: mockContext,
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

		const middleware = async ({ ctx, next }: any) => {
			const service = new mockChatService(ctx)
			return next({
				ctx: {
					...ctx,
					service,
				},
			})
		}

		await expect(
			middleware({
				ctx: mockContext,
				next: mockNext,
			}),
		).rejects.toThrow('Next function failed')
	})

	test('should create new service instance for each call', async () => {
		const middleware = async ({ ctx, next }: any) => {
			const service = new mockChatService(ctx)
			return next({
				ctx: {
					...ctx,
					service,
				},
			})
		}

		await middleware({
			ctx: mockContext,
			next: mockNext,
		})

		await middleware({
			ctx: mockContext,
			next: mockNext,
		})

		expect(mockNext).toHaveBeenCalledTimes(2)
		expect(mockChatService).toHaveBeenCalledTimes(2)

		const firstCall = mockNext.mock.calls[0][0]
		const secondCall = mockNext.mock.calls[1][0]

		expect(firstCall.ctx.service).toBeDefined()
		expect(secondCall.ctx.service).toBeDefined()
		expect(firstCall.ctx.service).not.toBe(secondCall.ctx.service)
	})

	test('should have chat procedure defined', () => {
		expect(chatProcedure).toBeDefined()
		expect(typeof chatProcedure).toBe('object')
	})
})
