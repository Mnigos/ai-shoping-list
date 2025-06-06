import type { ShoppingListItem } from '@prisma/client'
import type { QueryClient } from '@tanstack/react-query'
import { vi } from 'vitest'
import {
	createOptimisticErrorHandler,
	createOptimisticSettledHandler,
	createOptimisticUpdate,
} from './optimistic-updates'

describe('optimistic-updates', () => {
	const mockQueryClient = {
		cancelQueries: vi.fn(),
		getQueryData: vi.fn(),
		setQueryData: vi.fn(),
		invalidateQueries: vi.fn(),
	} as unknown as QueryClient

	const queryKey = ['shoppingList', 'getItems']
	const userId = 'test-user-id'
	const itemId = 'item-123'
	const itemName = 'Test Item'

	const mockItems: ShoppingListItem[] = [
		{
			id: itemId,
			name: itemName,
			amount: 2,
			isCompleted: false,
			createdAt: new Date('2024-01-01'),
			updatedAt: new Date('2024-01-01'),
			userId,
		},
		{
			id: 'item-456',
			name: 'Another Item',
			amount: 1,
			isCompleted: true,
			createdAt: new Date('2024-01-02'),
			updatedAt: new Date('2024-01-02'),
			userId,
		},
	]

	beforeEach(() => {
		vi.clearAllMocks()
		// Reset mock implementations to default behavior
		;(mockQueryClient.setQueryData as any).mockImplementation(() => {})
		;(mockQueryClient.getQueryData as any).mockImplementation(() => [])
		;(mockQueryClient.cancelQueries as any).mockImplementation(() =>
			Promise.resolve(),
		)
		;(mockQueryClient.invalidateQueries as any).mockImplementation(() =>
			Promise.resolve(),
		)
	})

	describe('createOptimisticUpdate', () => {
		test('should cancel queries and perform optimistic update', async () => {
			const updateFn = vi.fn().mockReturnValue([...mockItems])
			const variables = { id: itemId, amount: 5 }
			;(mockQueryClient.getQueryData as any).mockReturnValue(mockItems)
			;(mockQueryClient.setQueryData as any).mockImplementation(
				(key: any, fn: any) => {
					fn(mockItems)
				},
			)

			const optimisticUpdate = createOptimisticUpdate({
				queryClient: mockQueryClient,
				queryKey,
				updateFn,
			})

			const result = await optimisticUpdate(variables)

			expect(mockQueryClient.cancelQueries).toHaveBeenCalledWith({ queryKey })
			expect(mockQueryClient.getQueryData).toHaveBeenCalledWith(queryKey)
			expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
				queryKey,
				expect.any(Function),
			)
			expect(updateFn).toHaveBeenCalledWith(mockItems, variables)
			expect(result).toEqual({ previousItems: mockItems })
		})

		test('should handle empty query data gracefully', async () => {
			const updateFn = vi.fn().mockReturnValue([])
			const variables = { id: itemId, amount: 5 }
			;(mockQueryClient.getQueryData as any).mockReturnValue(null)
			;(mockQueryClient.setQueryData as any).mockImplementation(
				(key: any, fn: any) => {
					fn([])
				},
			)

			const optimisticUpdate = createOptimisticUpdate({
				queryClient: mockQueryClient,
				queryKey,
				updateFn,
			})

			const result = await optimisticUpdate(variables)

			expect(updateFn).toHaveBeenCalledWith([], variables)
			expect(result).toEqual({ previousItems: [] })
		})

		test('should create custom context when createContext is provided', async () => {
			const updateFn = vi.fn().mockReturnValue([...mockItems])
			const variables = { name: 'New Item', amount: 3 }
			const customContext = { optimisticItem: mockItems[0] }
			const createContext = vi.fn().mockReturnValue(customContext)
			;(mockQueryClient.getQueryData as any).mockReturnValue(mockItems)

			const optimisticUpdate = createOptimisticUpdate({
				queryClient: mockQueryClient,
				queryKey,
				updateFn,
				createContext,
			})

			const result = await optimisticUpdate(variables)

			expect(createContext).toHaveBeenCalledWith(mockItems, variables)
			expect(result).toEqual({ previousItems: mockItems, ...customContext })
		})
	})

	describe('createOptimisticErrorHandler', () => {
		test('should restore previous items on error', () => {
			const context = { previousItems: mockItems }
			const error = new Error('Network error')
			const variables = { id: itemId }

			const errorHandler = createOptimisticErrorHandler(
				mockQueryClient,
				queryKey,
			)
			errorHandler(error, variables, context)

			expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
				queryKey,
				mockItems,
			)
		})

		test('should not restore when context is undefined', () => {
			const error = new Error('Network error')
			const variables = { id: itemId }

			const errorHandler = createOptimisticErrorHandler(
				mockQueryClient,
				queryKey,
			)
			errorHandler(error, variables, undefined)

			expect(mockQueryClient.setQueryData).not.toHaveBeenCalled()
		})

		test('should not restore when context has no previousItems', () => {
			const context = {} as any
			const error = new Error('Network error')
			const variables = { id: itemId }

			const errorHandler = createOptimisticErrorHandler(
				mockQueryClient,
				queryKey,
			)
			errorHandler(error, variables, context)

			expect(mockQueryClient.setQueryData).not.toHaveBeenCalled()
		})

		test('should handle different error types', () => {
			const context = { previousItems: mockItems }
			const variables = { id: itemId }

			const errorHandler = createOptimisticErrorHandler(
				mockQueryClient,
				queryKey,
			)

			// Test with different error types
			const errorTypes = [
				new Error('Network error'),
				'String error',
				{ message: 'Object error' },
				null,
				undefined,
			]

			for (const error of errorTypes) {
				vi.clearAllMocks()
				errorHandler(error, variables, context)
				expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
					queryKey,
					mockItems,
				)
			}
		})
	})

	describe('createOptimisticSettledHandler', () => {
		test('should invalidate queries when called', () => {
			const settledHandler = createOptimisticSettledHandler(
				mockQueryClient,
				queryKey,
			)

			settledHandler()

			expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
				queryKey,
			})
		})

		test('should work with different query keys', () => {
			const customQueryKey = ['custom', 'query', 'key']
			const settledHandler = createOptimisticSettledHandler(
				mockQueryClient,
				customQueryKey,
			)

			settledHandler()

			expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
				queryKey: customQueryKey,
			})
		})
	})
})
