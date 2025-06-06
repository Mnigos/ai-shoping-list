import type { ShoppingListItem } from '@prisma/client'
import { renderHook } from '@testing-library/react'
import { vi } from 'vitest'
import { useAddItemMutation } from './use-add-item-mutation'

// Mock the dependencies
const mockUseMutation = vi.hoisted(() => vi.fn())
const mockUseQueryClient = vi.hoisted(() => vi.fn())
const mockUseTRPC = vi.hoisted(() => vi.fn())
const mockCreateOptimisticUpdate = vi.hoisted(() => vi.fn())
const mockCreateOptimisticErrorHandler = vi.hoisted(() => vi.fn())
const mockCreateOptimisticSettledHandler = vi.hoisted(() => vi.fn())
const mockUseSession = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-query', () => ({
	useMutation: mockUseMutation,
	useQueryClient: mockUseQueryClient,
}))

vi.mock('~/lib/trpc/react', () => ({
	useTRPC: mockUseTRPC,
}))

vi.mock('~/lib/auth-client', () => ({
	authClient: {
		useSession: mockUseSession,
	},
}))

vi.mock('./helpers/optimistic-updates', () => ({
	createOptimisticUpdate: mockCreateOptimisticUpdate,
	createOptimisticErrorHandler: mockCreateOptimisticErrorHandler,
	createOptimisticSettledHandler: mockCreateOptimisticSettledHandler,
}))

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
	value: {
		randomUUID: vi.fn(() => 'mock-uuid-123'),
	},
})

describe('useAddItemMutation', () => {
	const queryKey = ['shoppingList', 'getItems']
	const userId = 'test-user-id'
	const itemId = 'item-123'
	const itemName = 'Test Item'
	const defaultAmount = 3

	const mockQueryClient = {
		cancelQueries: vi.fn(),
		getQueryData: vi.fn(),
		setQueryData: vi.fn(),
		invalidateQueries: vi.fn(),
	}

	const mockTrpc = {
		shoppingList: {
			getItems: {
				queryKey: vi.fn(() => queryKey),
			},
			addItem: {
				mutationOptions: vi.fn(),
			},
		},
	}

	const mockOptimisticUpdate = vi.fn()
	const mockErrorHandler = vi.fn()
	const mockSettledHandler = vi.fn()
	const mockMutationResult = { mutate: vi.fn(), isLoading: false }

	const mockUser = {
		id: userId,
		name: 'Test User',
		email: 'test@example.com',
	}

	const mockSessionData = {
		user: mockUser,
		session: { id: 'session-123' },
	}

	const existingItems: ShoppingListItem[] = [
		{
			id: itemId,
			name: 'Existing Item',
			amount: 2,
			isCompleted: false,
			createdAt: new Date('2024-01-01'),
			updatedAt: new Date('2024-01-01'),
			userId,
		},
	]

	beforeEach(() => {
		vi.clearAllMocks()

		mockUseQueryClient.mockReturnValue(mockQueryClient)
		mockUseTRPC.mockReturnValue(mockTrpc)
		mockUseMutation.mockReturnValue(mockMutationResult)
		mockUseSession.mockReturnValue({ data: mockSessionData })
		mockCreateOptimisticUpdate.mockReturnValue(mockOptimisticUpdate)
		mockCreateOptimisticErrorHandler.mockReturnValue(mockErrorHandler)
		mockCreateOptimisticSettledHandler.mockReturnValue(mockSettledHandler)

		// Create a function that can be called
		const onSuccessFunction = vi.fn()
		const mockMutationOptions = {
			onMutate: mockOptimisticUpdate,
			onError: mockErrorHandler,
			onSuccess: onSuccessFunction,
			onSettled: mockSettledHandler,
		}
		mockTrpc.shoppingList.addItem.mutationOptions.mockReturnValue(
			mockMutationOptions,
		)
	})

	test('should initialize hook with correct dependencies', () => {
		renderHook(() => useAddItemMutation())

		expect(mockUseTRPC).toHaveBeenCalledTimes(1)
		expect(mockUseQueryClient).toHaveBeenCalledTimes(1)
		expect(mockUseSession).toHaveBeenCalledTimes(1)
		expect(mockTrpc.shoppingList.getItems.queryKey).toHaveBeenCalledTimes(1)
	})

	test('should create optimistic update with correct configuration', () => {
		renderHook(() => useAddItemMutation())

		expect(mockCreateOptimisticUpdate).toHaveBeenCalledWith({
			queryClient: mockQueryClient,
			queryKey,
			updateFn: expect.any(Function),
			createContext: expect.any(Function),
		})
	})

	test('should create error and settled handlers with correct parameters', () => {
		renderHook(() => useAddItemMutation())

		expect(mockCreateOptimisticErrorHandler).toHaveBeenCalledWith(
			mockQueryClient,
			queryKey,
		)
		expect(mockCreateOptimisticSettledHandler).toHaveBeenCalledWith(
			mockQueryClient,
			queryKey,
		)
	})

	test('should configure mutation with all handlers including onSuccess', () => {
		renderHook(() => useAddItemMutation())

		const mutationOptions =
			mockTrpc.shoppingList.addItem.mutationOptions.mock.calls[0][0]
		expect(mutationOptions).toHaveProperty('onMutate', mockOptimisticUpdate)
		expect(mutationOptions).toHaveProperty('onError', mockErrorHandler)
		expect(mutationOptions).toHaveProperty('onSuccess')
		expect(typeof mutationOptions.onSuccess).toBe('function')
		expect(mutationOptions).toHaveProperty('onSettled', mockSettledHandler)

		// Check that useMutation was called with the mutation options
		expect(mockUseMutation).toHaveBeenCalledTimes(1)
		const useMutationArg = mockUseMutation.mock.calls[0][0]
		expect(useMutationArg).toHaveProperty('onMutate', mockOptimisticUpdate)
		expect(useMutationArg).toHaveProperty('onError', mockErrorHandler)
		expect(useMutationArg).toHaveProperty('onSuccess')
		expect(useMutationArg).toHaveProperty('onSettled', mockSettledHandler)
	})

	test('should return mutation result from useMutation', () => {
		const { result } = renderHook(() => useAddItemMutation())

		expect(result.current).toBe(mockMutationResult)
	})

	describe('updateFn', () => {
		let updateFn: (
			items: ShoppingListItem[],
			variables: { name: string; amount?: number },
		) => ShoppingListItem[]

		beforeEach(() => {
			renderHook(() => useAddItemMutation())
			const callArgs = mockCreateOptimisticUpdate.mock.calls[0][0]
			updateFn = callArgs.updateFn
		})

		test('should add new item to beginning of list with default amount', () => {
			const variables = { name: itemName }
			const result = updateFn(existingItems, variables)

			expect(result).toHaveLength(existingItems.length + 1)
			expect(result[0]).toEqual({
				id: 'temp-mock-uuid-123',
				name: itemName,
				amount: 1,
				isCompleted: false,
				createdAt: expect.any(Date),
				updatedAt: expect.any(Date),
				userId,
			})
			expect(result[1]).toEqual(existingItems[0])
		})

		test('should add new item with custom amount', () => {
			const variables = { name: itemName, amount: defaultAmount }
			const result = updateFn(existingItems, variables)

			expect(result[0]).toEqual({
				id: 'temp-mock-uuid-123',
				name: itemName,
				amount: defaultAmount,
				isCompleted: false,
				createdAt: expect.any(Date),
				updatedAt: expect.any(Date),
				userId,
			})
		})

		test('should handle empty items array', () => {
			const variables = { name: itemName }
			const result = updateFn([], variables)

			expect(result).toHaveLength(1)
			expect(result[0].name).toBe(itemName)
		})

		test('should use temp-user when no session data', () => {
			mockUseSession.mockReturnValue({ data: null })
			renderHook(() => useAddItemMutation())
			const callArgs = mockCreateOptimisticUpdate.mock.calls[1][0]
			const updateFnNoSession = callArgs.updateFn

			const variables = { name: itemName }
			const result = updateFnNoSession(existingItems, variables)

			expect(result[0].userId).toBe('temp-user')
		})

		test.each([
			{ description: 'should handle zero amount', amount: 0 },
			{ description: 'should handle negative amount', amount: -1 },
			{ description: 'should handle large amount', amount: 999999 },
			{ description: 'should handle decimal amount', amount: 2.5 },
		])('$description', ({ amount }) => {
			const variables = { name: itemName, amount }
			const result = updateFn(existingItems, variables)

			expect(result[0].amount).toBe(amount)
		})

		test.each([
			{ description: 'should handle empty name', name: '' },
			{ description: 'should handle special characters', name: 'café ☕' },
			{ description: 'should handle long name', name: 'A'.repeat(1000) },
			{ description: 'should handle whitespace', name: '  test  ' },
		])('$description', ({ name }) => {
			const variables = { name }
			const result = updateFn(existingItems, variables)

			expect(result[0].name).toBe(name)
		})
	})

	describe('createContext', () => {
		let createContext: (
			previousItems: ShoppingListItem[],
			variables: { name: string; amount?: number },
		) => any

		beforeEach(() => {
			renderHook(() => useAddItemMutation())
			const callArgs = mockCreateOptimisticUpdate.mock.calls[0][0]
			createContext = callArgs.createContext
		})

		test('should create context with previousItems and optimisticItem', () => {
			const variables = { name: itemName, amount: defaultAmount }
			const result = createContext(existingItems, variables)

			expect(result).toEqual({
				previousItems: existingItems,
				optimisticItem: {
					id: 'temp-mock-uuid-123',
					name: itemName,
					amount: defaultAmount,
					isCompleted: false,
					createdAt: expect.any(Date),
					updatedAt: expect.any(Date),
					userId,
				},
			})
		})

		test('should use default amount when not provided', () => {
			const variables = { name: itemName }
			const result = createContext(existingItems, variables)

			expect(result.optimisticItem.amount).toBe(1)
		})

		test('should use temp-user when no session data', () => {
			mockUseSession.mockReturnValue({ data: null })
			renderHook(() => useAddItemMutation())
			const callArgs = mockCreateOptimisticUpdate.mock.calls[1][0]
			const createContextNoSession = callArgs.createContext

			const variables = { name: itemName }
			const result = createContextNoSession(existingItems, variables)

			expect(result.optimisticItem.userId).toBe('temp-user')
		})
	})

	describe('onSuccess handler', () => {
		test('should update query data with real item on success', () => {
			renderHook(() => useAddItemMutation())
			const mutationOptions =
				mockTrpc.shoppingList.addItem.mutationOptions.mock.calls[0][0]
			const onSuccess = mutationOptions.onSuccess

			const realItem: ShoppingListItem = {
				id: 'real-id-456',
				name: itemName,
				amount: defaultAmount,
				isCompleted: false,
				createdAt: new Date(),
				updatedAt: new Date(),
				userId,
			}

			const optimisticItem: ShoppingListItem = {
				id: 'temp-mock-uuid-123',
				name: itemName,
				amount: defaultAmount,
				isCompleted: false,
				createdAt: new Date(),
				updatedAt: new Date(),
				userId,
			}

			const context = {
				previousItems: existingItems,
				optimisticItem,
			}

			const variables = { name: itemName, amount: defaultAmount }
			const currentItems = [optimisticItem, ...existingItems]

			mockQueryClient.setQueryData.mockImplementation((key: any, fn: any) => {
				const result = fn(currentItems)
				expect(result).toEqual([realItem, ...existingItems])
			})

			onSuccess(realItem, variables, context)

			expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
				queryKey,
				expect.any(Function),
			)
		})

		test('should handle empty query data in onSuccess', () => {
			renderHook(() => useAddItemMutation())
			const mutationOptions =
				mockTrpc.shoppingList.addItem.mutationOptions.mock.calls[0][0]
			const onSuccess = mutationOptions.onSuccess

			const realItem: ShoppingListItem = {
				id: 'real-id-456',
				name: itemName,
				amount: defaultAmount,
				isCompleted: false,
				createdAt: new Date(),
				updatedAt: new Date(),
				userId,
			}

			const context = {
				previousItems: existingItems,
				optimisticItem: {
					id: 'temp-mock-uuid-123',
					name: itemName,
					amount: defaultAmount,
					isCompleted: false,
					createdAt: new Date(),
					updatedAt: new Date(),
					userId,
				},
			}

			const variables = { name: itemName, amount: defaultAmount }

			mockQueryClient.setQueryData.mockImplementation((key: any, fn: any) => {
				const result = fn(null)
				expect(result).toEqual([])
			})

			onSuccess(realItem, variables, context)

			expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
				queryKey,
				expect.any(Function),
			)
		})
	})
})
