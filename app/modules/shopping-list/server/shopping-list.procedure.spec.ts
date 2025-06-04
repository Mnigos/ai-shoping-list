import { vi } from 'vitest'

const mockShoppingListService = vi.hoisted(() =>
	vi.fn().mockImplementation(() => ({
		getItems: vi.fn(),
		addItem: vi.fn(),
		updateItem: vi.fn(),
		deleteItem: vi.fn(),
		executeActions: vi.fn(),
		toggleComplete: vi.fn(),
	})),
)

// Mock the ShoppingListService directly
vi.mock('./shopping-list.service', () => ({
	ShoppingListService: mockShoppingListService,
}))

import { shoppingListProcedure } from './shopping-list.procedure'

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
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	},
}

const mockContext = {
	user: mockUser,
	prisma: mockPrisma,
	env: {},
}

const mockNext = vi.fn()

describe('ShoppingListProcedure', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockNext.mockResolvedValue({ success: true })
	})

	test('should add service to context', async () => {
		const middleware = async ({ ctx, next }: any) => {
			const service = new mockShoppingListService(ctx)
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

		expect(mockShoppingListService).toHaveBeenCalledWith(mockContext)
		expect(mockNext).toHaveBeenCalledWith({
			ctx: {
				...mockContext,
				service: expect.any(Object),
			},
		})
	})

	test('should pass through original context properties', async () => {
		const middleware = async ({ ctx, next }: any) => {
			const service = new mockShoppingListService(ctx)
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
			const service = new mockShoppingListService(ctx)
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
			const service = new mockShoppingListService(ctx)
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
		expect(mockShoppingListService).toHaveBeenCalledTimes(2)

		const firstCall = mockNext.mock.calls[0][0]
		const secondCall = mockNext.mock.calls[1][0]

		expect(firstCall.ctx.service).toBeDefined()
		expect(secondCall.ctx.service).toBeDefined()
		expect(firstCall.ctx.service).not.toBe(secondCall.ctx.service)
	})

	test('should work with different request types', async () => {
		const middleware = async ({ ctx, next }: any) => {
			const service = new mockShoppingListService(ctx)
			return next({
				ctx: {
					...ctx,
					service,
				},
			})
		}

		const testCases = [
			{ type: 'query' as const, path: 'getItems' },
			{ type: 'mutation' as const, path: 'addItem' },
			{ type: 'mutation' as const, path: 'updateItem' },
			{ type: 'mutation' as const, path: 'deleteItem' },
		]

		for (const testCase of testCases) {
			await middleware({
				ctx: mockContext,
				next: mockNext,
			})
		}

		expect(mockNext).toHaveBeenCalledTimes(testCases.length)
		expect(mockShoppingListService).toHaveBeenCalledTimes(testCases.length)

		for (let i = 0; i < testCases.length; i++) {
			const callArgs = mockNext.mock.calls[i][0]
			expect(callArgs.ctx.service).toBeDefined()
		}
	})

	test('should have shopping list procedure defined', () => {
		expect(shoppingListProcedure).toBeDefined()
		expect(typeof shoppingListProcedure).toBe('object')
	})
})
