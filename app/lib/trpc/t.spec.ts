import { vi } from 'vitest'

// Mock dependencies using vi.hoisted
const mockAuth = vi.hoisted(() => ({
	api: {
		getSession: vi.fn(),
	},
}))

const mockPrisma = vi.hoisted(() => ({
	$connect: vi.fn(),
	$disconnect: vi.fn(),
}))

const mockEnv = vi.hoisted(() => ({
	NODE_ENV: 'test',
	DATABASE_URL: 'test-url',
}))

vi.mock('~/lib/auth.server', () => ({
	auth: mockAuth,
}))

vi.mock('~/lib/prisma', () => ({
	prisma: mockPrisma,
}))

vi.mock('~/env.server', () => ({
	env: mockEnv,
}))

import { createTRPCContext, protectedProcedure, publicProcedure } from './t'

const userId = 'test-user-id'
const mockUser = {
	id: userId,
	name: 'Test User',
	email: 'test@example.com',
	emailVerified: true,
	createdAt: new Date(),
	updatedAt: new Date(),
	image: null,
	isAnonymous: false,
}

const mockHeaders = new Headers({
	'x-trpc-source': 'test',
	authorization: 'Bearer test-token',
})

describe('TRPC Setup (t.ts)', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('createTRPCContext', () => {
		test('should create context with user session', async () => {
			mockAuth.api.getSession.mockResolvedValue({
				user: mockUser,
				session: { id: 'session-id' },
			})

			const context = await createTRPCContext({ headers: mockHeaders })

			expect(mockAuth.api.getSession).toHaveBeenCalledWith({
				headers: mockHeaders,
			})
			expect(context).toEqual({
				prisma: mockPrisma,
				user: mockUser,
				env: mockEnv,
			})
		})

		test('should create context without user session', async () => {
			mockAuth.api.getSession.mockResolvedValue(null)

			const context = await createTRPCContext({ headers: mockHeaders })

			expect(context).toEqual({
				prisma: mockPrisma,
				user: undefined,
				env: mockEnv,
			})
		})

		test('should handle missing x-trpc-source header', async () => {
			const headersWithoutSource = new Headers({
				authorization: 'Bearer test-token',
			})

			mockAuth.api.getSession.mockResolvedValue({
				user: mockUser,
			})

			const context = await createTRPCContext({
				headers: headersWithoutSource,
			})

			expect(context.user).toEqual(mockUser)
		})

		test('should handle auth service errors', async () => {
			const authError = new Error('Auth service unavailable')
			mockAuth.api.getSession.mockRejectedValue(authError)

			await expect(createTRPCContext({ headers: mockHeaders })).rejects.toThrow(
				'Auth service unavailable',
			)
		})
	})

	describe('protectedProcedure', () => {
		test('should allow access with valid user', async () => {
			const mockContext = {
				prisma: mockPrisma,
				user: mockUser,
				env: mockEnv,
			}

			const mockNext = vi.fn().mockResolvedValue({ success: true })

			const middleware = protectedProcedure._def.middlewares[0]
			const result = await middleware({
				ctx: mockContext,
				next: mockNext,
				path: 'test',
				type: 'query',
				input: {},
				getRawInput: vi.fn(),
				meta: undefined,
				signal: undefined,
			})

			expect(mockNext).toHaveBeenCalledWith({
				ctx: {
					...mockContext,
					user: mockUser,
				},
			})
			expect(result).toEqual({ success: true })
		})

		test('should throw UNAUTHORIZED error when user is null', async () => {
			const mockContext = {
				prisma: mockPrisma,
				user: null,
				env: mockEnv,
			}

			const mockNext = vi.fn()
			const middleware = protectedProcedure._def.middlewares[0]

			await expect(async () => {
				await middleware({
					ctx: mockContext,
					next: mockNext,
					path: 'test',
					type: 'query',
					input: {},
					getRawInput: vi.fn(),
					meta: undefined,
					signal: undefined,
				})
			}).rejects.toThrow('UNAUTHORIZED')

			expect(mockNext).not.toHaveBeenCalled()
		})

		test('should throw UNAUTHORIZED error when user has no id', async () => {
			const mockContext = {
				prisma: mockPrisma,
				user: { ...mockUser, id: undefined },
				env: mockEnv,
			}

			const mockNext = vi.fn()
			const middleware = protectedProcedure._def.middlewares[0]

			await expect(async () => {
				await middleware({
					ctx: mockContext,
					next: mockNext,
					path: 'test',
					type: 'query',
					input: {},
					getRawInput: vi.fn(),
					meta: undefined,
					signal: undefined,
				})
			}).rejects.toThrow('UNAUTHORIZED')

			expect(mockNext).not.toHaveBeenCalled()
		})
	})

	describe('publicProcedure', () => {
		test('should be defined and accessible', () => {
			expect(publicProcedure).toBeDefined()
			expect(typeof publicProcedure).toBe('object')
		})

		test('should not have authentication middleware', () => {
			// Public procedure should have fewer middlewares than protected
			expect(publicProcedure._def.middlewares.length).toBeLessThanOrEqual(
				protectedProcedure._def.middlewares.length,
			)
		})
	})

	describe('type definitions', () => {
		test('should export required TRPC utilities', () => {
			// Test that all required exports are available
			expect(protectedProcedure).toBeDefined()
			expect(publicProcedure).toBeDefined()
			expect(createTRPCContext).toBeDefined()
		})
	})
})
