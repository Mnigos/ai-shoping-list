import type { ShoppingListItem } from '@prisma/client'
import { renderHook } from '@testing-library/react'
import { vi } from 'vitest'
import { useToggleCompleteMutation } from './use-toggle-complete-mutation'

// Mock the dependencies
const mockUseMutation = vi.hoisted(() => vi.fn())
const mockUseQueryClient = vi.hoisted(() => vi.fn())
const mockUseTRPC = vi.hoisted(() => vi.fn())
const mockCreateOptimisticUpdate = vi.hoisted(() => vi.fn())
const mockCreateOptimisticErrorHandler = vi.hoisted(() => vi.fn())
const mockCreateOptimisticSettledHandler = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-query', () => ({
	useMutation: mockUseMutation,
	useQueryClient: mockUseQueryClient,
}))

vi.mock('~/lib/trpc/react', () => ({
	useTRPC: mockUseTRPC,
}))

vi.mock('./helpers/optimistic-updates', () => ({
	createOptimisticUpdate: mockCreateOptimisticUpdate,
	createOptimisticErrorHandler: mockCreateOptimisticErrorHandler,
	createOptimisticSettledHandler: mockCreateOptimisticSettledHandler,
}))

describe('useToggleCompleteMutation', () => {
	const queryKey = ['shoppingList', 'getItems']
	const userId = 'test-user-id'
	const itemId = 'item-123'
	const itemName = 'Test Item'

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
			toggleComplete: {
				mutationOptions: vi.fn(),
			},
		},
	}

	const mockOptimisticUpdate = vi.fn()
	const mockErrorHandler = vi.fn()
	const mockSettledHandler = vi.fn()
	const mockMutationResult = { mutate: vi.fn(), isLoading: false }

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

		mockUseQueryClient.mockReturnValue(mockQueryClient)
		mockUseTRPC.mockReturnValue(mockTrpc)
		mockUseMutation.mockReturnValue(mockMutationResult)
		mockCreateOptimisticUpdate.mockReturnValue(mockOptimisticUpdate)
		mockCreateOptimisticErrorHandler.mockReturnValue(mockErrorHandler)
		mockCreateOptimisticSettledHandler.mockReturnValue(mockSettledHandler)

		mockTrpc.shoppingList.toggleComplete.mutationOptions.mockReturnValue({
			onMutate: mockOptimisticUpdate,
			onError: mockErrorHandler,
			onSettled: mockSettledHandler,
		})
	})

	test('should initialize hook with correct dependencies', () => {
		renderHook(() => useToggleCompleteMutation())

		expect(mockUseTRPC).toHaveBeenCalledTimes(1)
		expect(mockUseQueryClient).toHaveBeenCalledTimes(1)
		expect(mockTrpc.shoppingList.getItems.queryKey).toHaveBeenCalledTimes(1)
	})

	test('should create optimistic update with correct configuration', () => {
		renderHook(() => useToggleCompleteMutation())

		expect(mockCreateOptimisticUpdate).toHaveBeenCalledWith({
			queryClient: mockQueryClient,
			queryKey,
			updateFn: expect.any(Function),
		})
	})

	test('should create error and settled handlers with correct parameters', () => {
		renderHook(() => useToggleCompleteMutation())

		expect(mockCreateOptimisticErrorHandler).toHaveBeenCalledWith(
			mockQueryClient,
			queryKey,
		)
		expect(mockCreateOptimisticSettledHandler).toHaveBeenCalledWith(
			mockQueryClient,
			queryKey,
		)
	})

	test('should configure mutation with all handlers', () => {
		renderHook(() => useToggleCompleteMutation())

		expect(
			mockTrpc.shoppingList.toggleComplete.mutationOptions,
		).toHaveBeenCalledWith({
			onMutate: mockOptimisticUpdate,
			onError: mockErrorHandler,
			onSettled: mockSettledHandler,
		})
		expect(mockUseMutation).toHaveBeenCalledWith({
			onMutate: mockOptimisticUpdate,
			onError: mockErrorHandler,
			onSettled: mockSettledHandler,
		})
	})

	test('should return mutation result from useMutation', () => {
		const { result } = renderHook(() => useToggleCompleteMutation())

		expect(result.current).toBe(mockMutationResult)
	})

	describe('updateFn', () => {
		let updateFn: (
			items: ShoppingListItem[],
			variables: { id: string },
		) => ShoppingListItem[]

		beforeEach(() => {
			renderHook(() => useToggleCompleteMutation())
			const callArgs = mockCreateOptimisticUpdate.mock.calls[0][0]
			updateFn = callArgs.updateFn
		})

		test('should toggle isCompleted from false to true', () => {
			const variables = { id: itemId }
			const result = updateFn(mockItems, variables)

			expect(result).toHaveLength(mockItems.length)
			expect(result[0]).toEqual({ ...mockItems[0], isCompleted: true })
			expect(result[1]).toEqual(mockItems[1])
		})

		test('should toggle isCompleted from true to false', () => {
			const variables = { id: 'item-456' }
			const result = updateFn(mockItems, variables)

			expect(result).toHaveLength(mockItems.length)
			expect(result[0]).toEqual(mockItems[0])
			expect(result[1]).toEqual({ ...mockItems[1], isCompleted: false })
		})

		test('should not modify items when id does not match', () => {
			const variables = { id: 'non-existent-id' }
			const result = updateFn(mockItems, variables)

			expect(result).toEqual(mockItems)
		})

		test('should handle empty items array', () => {
			const variables = { id: itemId }
			const result = updateFn([], variables)

			expect(result).toEqual([])
		})

		test('should handle multiple items with same id', () => {
			const duplicateItems = [...mockItems, { ...mockItems[0], id: itemId }]
			const variables = { id: itemId }
			const result = updateFn(duplicateItems, variables)

			expect(result).toHaveLength(duplicateItems.length)
			expect(result[0]).toEqual({ ...mockItems[0], isCompleted: true })
			expect(result[2]).toEqual({ ...mockItems[0], isCompleted: true })
			expect(result[1]).toEqual(mockItems[1])
		})

		test('should preserve all other item properties when toggling', () => {
			const variables = { id: itemId }
			const result = updateFn(mockItems, variables)

			const updatedItem = result[0]
			expect(updatedItem.id).toBe(mockItems[0].id)
			expect(updatedItem.name).toBe(mockItems[0].name)
			expect(updatedItem.amount).toBe(mockItems[0].amount)
			expect(updatedItem.createdAt).toBe(mockItems[0].createdAt)
			expect(updatedItem.updatedAt).toBe(mockItems[0].updatedAt)
			expect(updatedItem.userId).toBe(mockItems[0].userId)
			expect(updatedItem.isCompleted).toBe(!mockItems[0].isCompleted)
		})

		test.each([
			{
				description: 'should toggle completed item to incomplete',
				initialState: true,
				expectedState: false,
			},
			{
				description: 'should toggle incomplete item to completed',
				initialState: false,
				expectedState: true,
			},
		])('$description', ({ initialState, expectedState }) => {
			const testItem = { ...mockItems[0], isCompleted: initialState }
			const testItems = [testItem, mockItems[1]]
			const variables = { id: itemId }

			const result = updateFn(testItems, variables)

			expect(result[0]).toEqual({ ...testItem, isCompleted: expectedState })
		})
	})
})
