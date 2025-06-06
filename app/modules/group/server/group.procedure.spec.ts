import { vi } from 'vitest'

const mockGroupService = vi.hoisted(() =>
	vi.fn().mockImplementation(() => ({
		getMyGroups: vi.fn(),
		getGroupDetails: vi.fn(),
		createGroup: vi.fn(),
		updateGroup: vi.fn(),
		deleteGroup: vi.fn(),
	})),
)

// Mock the GroupService directly
vi.mock('./group.service', () => ({
	GroupService: mockGroupService,
}))

import { groupProcedure } from './group.procedure'

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
	group: {
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	},
	groupMember: {
		findMany: vi.fn(),
		findUnique: vi.fn(),
	},
}

const mockContext = {
	user: mockUser,
	prisma: mockPrisma,
	env: {},
}

const mockNext = vi.fn()

// Helper to create a complete middleware context
function createMiddlewareContext(overrides = {}) {
	return {
		ctx: mockContext,
		type: 'query' as const,
		path: 'test.path',
		input: {},
		getRawInput: vi.fn(),
		meta: {},
		signal: undefined,
		next: mockNext,
		...overrides,
	}
}

describe('GroupProcedure', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockNext.mockResolvedValue({ success: true })
	})

	test('should add service to context', async () => {
		// Get the group middleware (last one in the chain)
		const middlewares = groupProcedure._def.middlewares
		const groupMiddleware = middlewares[middlewares.length - 1]

		await groupMiddleware(createMiddlewareContext())

		expect(mockGroupService).toHaveBeenCalledWith(mockContext)
		expect(mockNext).toHaveBeenCalledWith({
			ctx: {
				...mockContext,
				service: expect.any(Object),
			},
		})
	})

	test('should pass through original context properties', async () => {
		// Get the group middleware (last one in the chain)
		const middlewares = groupProcedure._def.middlewares
		const groupMiddleware = middlewares[middlewares.length - 1]

		await groupMiddleware(createMiddlewareContext())

		const callArgs = mockNext.mock.calls[0][0]
		expect(callArgs.ctx.user).toEqual(mockUser)
		expect(callArgs.ctx.prisma).toEqual(mockPrisma)
		expect(callArgs.ctx.env).toEqual({})
		expect(callArgs.ctx.service).toBeDefined()
	})

	test('should handle next function errors', async () => {
		const error = new Error('Next function failed')
		mockNext.mockRejectedValue(error)

		// Get the group middleware (last one in the chain)
		const middlewares = groupProcedure._def.middlewares
		const groupMiddleware = middlewares[middlewares.length - 1]

		await expect(groupMiddleware(createMiddlewareContext())).rejects.toThrow(
			'Next function failed',
		)
	})

	test('should create new service instance for each call', async () => {
		// Get the group middleware (last one in the chain)
		const middlewares = groupProcedure._def.middlewares
		const groupMiddleware = middlewares[middlewares.length - 1]

		await groupMiddleware(createMiddlewareContext())
		await groupMiddleware(createMiddlewareContext())

		expect(mockNext).toHaveBeenCalledTimes(2)
		expect(mockGroupService).toHaveBeenCalledTimes(2)

		const firstCall = mockNext.mock.calls[0][0]
		const secondCall = mockNext.mock.calls[1][0]

		expect(firstCall.ctx.service).toBeDefined()
		expect(secondCall.ctx.service).toBeDefined()
		expect(firstCall.ctx.service).not.toBe(secondCall.ctx.service)
	})

	test('should work with different request types', async () => {
		// Get the group middleware (last one in the chain)
		const middlewares = groupProcedure._def.middlewares
		const groupMiddleware = middlewares[middlewares.length - 1]

		const testCases = [
			{ type: 'query' as const, path: 'getMyGroups' },
			{ type: 'query' as const, path: 'getGroupDetails' },
			{ type: 'mutation' as const, path: 'createGroup' },
			{ type: 'mutation' as const, path: 'updateGroup' },
			{ type: 'mutation' as const, path: 'deleteGroup' },
		]

		for (const testCase of testCases) {
			await groupMiddleware(
				createMiddlewareContext({
					type: testCase.type,
					path: testCase.path,
				}),
			)
		}

		expect(mockNext).toHaveBeenCalledTimes(testCases.length)
		expect(mockGroupService).toHaveBeenCalledTimes(testCases.length)

		for (let i = 0; i < testCases.length; i++) {
			const callArgs = mockNext.mock.calls[i][0]
			expect(callArgs.ctx.service).toBeDefined()
		}
	})

	test('should have group procedure defined', () => {
		expect(groupProcedure).toBeDefined()
		expect(typeof groupProcedure).toBe('object')
	})
})
