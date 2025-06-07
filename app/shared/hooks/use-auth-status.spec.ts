import { renderHook } from '@testing-library/react'
import { vi } from 'vitest'
import { useAuthStatus, useCanPerformGroupActions } from './use-auth-status'

// Mock the auth client
const mockUseSession = vi.hoisted(() => vi.fn())

vi.mock('~/lib/auth-client', () => ({
	authClient: {
		useSession: mockUseSession,
	},
}))

describe('useAuthStatus', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	test('should return authenticated status for regular user', () => {
		const mockUser = {
			id: 'user-123',
			name: 'John Doe',
			email: 'john@example.com',
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			image: null,
			isAnonymous: false,
		}

		mockUseSession.mockReturnValue({
			data: { user: mockUser },
			isPending: false,
		})

		const { result } = renderHook(() => useAuthStatus())

		expect(result.current).toEqual({
			isAuthenticated: true,
			isAnonymous: false,
			isLoading: false,
			user: mockUser,
		})
	})

	test('should return anonymous status for anonymous user', () => {
		const mockAnonymousUser = {
			id: 'anon-123',
			name: 'Anonymous',
			email: 'anon@example.com',
			emailVerified: false,
			createdAt: new Date(),
			updatedAt: new Date(),
			image: null,
			isAnonymous: true,
		}

		mockUseSession.mockReturnValue({
			data: { user: mockAnonymousUser },
			isPending: false,
		})

		const { result } = renderHook(() => useAuthStatus())

		expect(result.current).toEqual({
			isAuthenticated: true,
			isAnonymous: true,
			isLoading: false,
			user: mockAnonymousUser,
		})
	})

	test('should return unauthenticated status when no session', () => {
		mockUseSession.mockReturnValue({
			data: null,
			isPending: false,
		})

		const { result } = renderHook(() => useAuthStatus())

		expect(result.current).toEqual({
			isAuthenticated: false,
			isAnonymous: false,
			isLoading: false,
			user: null,
		})
	})

	test('should return loading status when session is pending', () => {
		mockUseSession.mockReturnValue({
			data: null,
			isPending: true,
		})

		const { result } = renderHook(() => useAuthStatus())

		expect(result.current).toEqual({
			isAuthenticated: false,
			isAnonymous: false,
			isLoading: true,
			user: null,
		})
	})

	test('should handle user with null isAnonymous field', () => {
		const mockUser = {
			id: 'user-123',
			name: 'John Doe',
			email: 'john@example.com',
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			image: null,
			isAnonymous: null,
		}

		mockUseSession.mockReturnValue({
			data: { user: mockUser },
			isPending: false,
		})

		const { result } = renderHook(() => useAuthStatus())

		expect(result.current.isAnonymous).toBe(false)
		expect(result.current.isAuthenticated).toBe(true)
	})
})

describe('useCanPerformGroupActions', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	test('should return true for authenticated non-anonymous user', () => {
		const mockUser = {
			id: 'user-123',
			name: 'John Doe',
			email: 'john@example.com',
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			image: null,
			isAnonymous: false,
		}

		mockUseSession.mockReturnValue({
			data: { user: mockUser },
			isPending: false,
		})

		const { result } = renderHook(() => useCanPerformGroupActions())

		expect(result.current).toBe(true)
	})

	test('should return false for anonymous user', () => {
		const mockAnonymousUser = {
			id: 'anon-123',
			name: 'Anonymous',
			email: 'anon@example.com',
			emailVerified: false,
			createdAt: new Date(),
			updatedAt: new Date(),
			image: null,
			isAnonymous: true,
		}

		mockUseSession.mockReturnValue({
			data: { user: mockAnonymousUser },
			isPending: false,
		})

		const { result } = renderHook(() => useCanPerformGroupActions())

		expect(result.current).toBe(false)
	})

	test('should return false for unauthenticated user', () => {
		mockUseSession.mockReturnValue({
			data: null,
			isPending: false,
		})

		const { result } = renderHook(() => useCanPerformGroupActions())

		expect(result.current).toBe(false)
	})

	test('should return false when session is loading', () => {
		mockUseSession.mockReturnValue({
			data: null,
			isPending: true,
		})

		const { result } = renderHook(() => useCanPerformGroupActions())

		expect(result.current).toBe(false)
	})

	test('should return true for user with null isAnonymous field', () => {
		const mockUser = {
			id: 'user-123',
			name: 'John Doe',
			email: 'john@example.com',
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			image: null,
			isAnonymous: null,
		}

		mockUseSession.mockReturnValue({
			data: { user: mockUser },
			isPending: false,
		})

		const { result } = renderHook(() => useCanPerformGroupActions())

		expect(result.current).toBe(true)
	})
})
