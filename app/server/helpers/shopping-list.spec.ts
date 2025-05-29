import { vi } from 'vitest'
import {
	type PrismaTransaction,
	ShoppingListActionSchema,
	handleAddAction,
	handleCompleteAction,
	handleDeleteAction,
	handleUpdateAction,
} from './shopping-list'

const mockTx: PrismaTransaction = {
	shoppingListItem: {
		findFirst: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	},
} as unknown as PrismaTransaction

const userId = 'test-user-id'
const itemName = 'Apples'
const itemId = 'item-id'
const defaultAmount = 5

describe('ShoppingListActionSchema', () => {
	test.each([
		{
			name: 'valid add action',
			input: { action: 'add', name: itemName, amount: defaultAmount },
			expected: { action: 'add', name: itemName, amount: defaultAmount },
		},
		{
			name: 'action without amount',
			input: { action: 'delete', name: itemName },
			expected: { action: 'delete', name: itemName },
		},
	])('should validate $name', ({ input, expected }) => {
		const result = ShoppingListActionSchema.parse(input)
		expect(result).toEqual(expected)
	})

	test.each([
		{
			name: 'invalid action',
			input: { action: 'invalid', name: itemName },
		},
		{
			name: 'amount less than 1',
			input: { action: 'add', name: itemName, amount: 0 },
			expectedError: 'Amount must be at least 1',
		},
		{
			name: 'missing name',
			input: { action: 'add', amount: defaultAmount },
		},
	])('should reject $name', ({ input, expectedError }) => {
		expect(() => ShoppingListActionSchema.parse(input)).toThrow(expectedError)
	})
})

describe('handleAddAction', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	test.each([
		{
			name: 'amount is missing',
			action: { action: 'add' as const, name: itemName },
		},
		{
			name: 'amount is less than 1',
			action: { action: 'add' as const, name: itemName, amount: 0 },
		},
	])('should throw error when $name', async ({ action }) => {
		await expect(handleAddAction(mockTx, userId, action)).rejects.toThrow(
			'Amount must be at least 1 for add action',
		)
	})

	test('should create new item when it does not exist', async () => {
		const action = {
			action: 'add' as const,
			name: itemName,
			amount: defaultAmount,
		}

		mockTx.shoppingListItem.findFirst = vi.fn().mockResolvedValue(null)
		mockTx.shoppingListItem.create = vi.fn().mockResolvedValue({})

		await handleAddAction(mockTx, userId, action)

		expect(mockTx.shoppingListItem.findFirst).toHaveBeenCalledWith({
			where: {
				userId,
				name: {
					equals: itemName,
					mode: 'insensitive',
				},
			},
		})

		expect(mockTx.shoppingListItem.create).toHaveBeenCalledWith({
			data: {
				name: itemName,
				amount: defaultAmount,
				userId,
			},
		})
	})

	test('should update existing item by adding amount', async () => {
		const existingAmount = 2
		const addAmount = 3
		const expectedTotal = existingAmount + addAmount
		const action = { action: 'add' as const, name: itemName, amount: addAmount }
		const existingItem = { id: itemId, amount: existingAmount }

		mockTx.shoppingListItem.findFirst = vi.fn().mockResolvedValue(existingItem)
		mockTx.shoppingListItem.update = vi.fn().mockResolvedValue({})

		await handleAddAction(mockTx, userId, action)

		expect(mockTx.shoppingListItem.update).toHaveBeenCalledWith({
			where: { id: itemId },
			data: { amount: expectedTotal },
		})
	})

	test('should handle case-insensitive name matching', async () => {
		const upperCaseName = 'APPLES'
		const action = { action: 'add' as const, name: upperCaseName, amount: 1 }

		mockTx.shoppingListItem.findFirst = vi.fn().mockResolvedValue(null)
		mockTx.shoppingListItem.create = vi.fn().mockResolvedValue({})

		await handleAddAction(mockTx, userId, action)

		expect(mockTx.shoppingListItem.findFirst).toHaveBeenCalledWith({
			where: {
				userId,
				name: {
					equals: upperCaseName,
					mode: 'insensitive',
				},
			},
		})
	})
})

describe('handleUpdateAction', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	test.each([
		{
			name: 'amount is missing',
			action: { action: 'update' as const, name: itemName },
		},
		{
			name: 'amount is less than 1',
			action: { action: 'update' as const, name: itemName, amount: 0 },
		},
	])('should throw error when $name', async ({ action }) => {
		await expect(handleUpdateAction(mockTx, userId, action)).rejects.toThrow(
			'Amount must be at least 1 for update action',
		)
	})

	test('should throw error when item does not exist', async () => {
		const action = {
			action: 'update' as const,
			name: itemName,
			amount: defaultAmount,
		}

		mockTx.shoppingListItem.findFirst = vi.fn().mockResolvedValue(null)

		await expect(handleUpdateAction(mockTx, userId, action)).rejects.toThrow(
			`Item "${itemName}" not found`,
		)
	})

	test('should update existing item with new amount', async () => {
		const newAmount = 10
		const action = {
			action: 'update' as const,
			name: itemName,
			amount: newAmount,
		}
		const existingItem = { id: itemId, amount: defaultAmount }

		mockTx.shoppingListItem.findFirst = vi.fn().mockResolvedValue(existingItem)
		mockTx.shoppingListItem.update = vi.fn().mockResolvedValue({})

		await handleUpdateAction(mockTx, userId, action)

		expect(mockTx.shoppingListItem.findFirst).toHaveBeenCalledWith({
			where: {
				userId,
				name: {
					equals: itemName,
					mode: 'insensitive',
				},
			},
		})

		expect(mockTx.shoppingListItem.update).toHaveBeenCalledWith({
			where: { id: itemId },
			data: { amount: newAmount },
		})
	})

	test('should handle case-insensitive name matching', async () => {
		const lowerCaseName = 'apples'
		const updateAmount = 3
		const action = {
			action: 'update' as const,
			name: lowerCaseName,
			amount: updateAmount,
		}
		const existingItem = { id: itemId, amount: defaultAmount }

		mockTx.shoppingListItem.findFirst = vi.fn().mockResolvedValue(existingItem)
		mockTx.shoppingListItem.update = vi.fn().mockResolvedValue({})

		await handleUpdateAction(mockTx, userId, action)

		expect(mockTx.shoppingListItem.findFirst).toHaveBeenCalledWith({
			where: {
				userId,
				name: {
					equals: lowerCaseName,
					mode: 'insensitive',
				},
			},
		})
	})
})

describe('handleDeleteAction', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	test('should throw error when item does not exist', async () => {
		const action = { action: 'delete' as const, name: itemName }

		mockTx.shoppingListItem.findFirst = vi.fn().mockResolvedValue(null)

		await expect(handleDeleteAction(mockTx, userId, action)).rejects.toThrow(
			`Item "${itemName}" not found`,
		)
	})

	test('should delete existing item', async () => {
		const action = { action: 'delete' as const, name: itemName }
		const existingItem = { id: itemId }

		mockTx.shoppingListItem.findFirst = vi.fn().mockResolvedValue(existingItem)
		mockTx.shoppingListItem.delete = vi.fn().mockResolvedValue({})

		await handleDeleteAction(mockTx, userId, action)

		expect(mockTx.shoppingListItem.findFirst).toHaveBeenCalledWith({
			where: {
				userId,
				name: {
					equals: itemName,
					mode: 'insensitive',
				},
			},
		})

		expect(mockTx.shoppingListItem.delete).toHaveBeenCalledWith({
			where: { id: itemId },
		})
	})

	test('should handle case-insensitive name matching', async () => {
		const upperCaseName = 'APPLES'
		const action = { action: 'delete' as const, name: upperCaseName }
		const existingItem = { id: itemId }

		mockTx.shoppingListItem.findFirst = vi.fn().mockResolvedValue(existingItem)
		mockTx.shoppingListItem.delete = vi.fn().mockResolvedValue({})

		await handleDeleteAction(mockTx, userId, action)

		expect(mockTx.shoppingListItem.findFirst).toHaveBeenCalledWith({
			where: {
				userId,
				name: {
					equals: upperCaseName,
					mode: 'insensitive',
				},
			},
		})
	})
})

describe('handleCompleteAction', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	test('should throw error when item does not exist', async () => {
		const action = { action: 'complete' as const, name: itemName }

		mockTx.shoppingListItem.findFirst = vi.fn().mockResolvedValue(null)

		await expect(handleCompleteAction(mockTx, userId, action)).rejects.toThrow(
			`Item "${itemName}" not found`,
		)
	})

	test.each([
		{
			name: 'toggle completion status from false to true',
			isCompleted: false,
			expectedResult: true,
		},
		{
			name: 'toggle completion status from true to false',
			isCompleted: true,
			expectedResult: false,
		},
	])('should $name', async ({ isCompleted, expectedResult }) => {
		const action = { action: 'complete' as const, name: itemName }
		const existingItem = { id: itemId, isCompleted }

		mockTx.shoppingListItem.findFirst = vi.fn().mockResolvedValue(existingItem)
		mockTx.shoppingListItem.update = vi.fn().mockResolvedValue({})

		await handleCompleteAction(mockTx, userId, action)

		expect(mockTx.shoppingListItem.findFirst).toHaveBeenCalledWith({
			where: {
				userId,
				name: {
					equals: itemName,
					mode: 'insensitive',
				},
			},
		})

		expect(mockTx.shoppingListItem.update).toHaveBeenCalledWith({
			where: { id: itemId },
			data: { isCompleted: expectedResult },
		})
	})

	test('should handle case-insensitive name matching', async () => {
		const lowerCaseName = 'bananas'
		const action = { action: 'complete' as const, name: lowerCaseName }
		const existingItem = { id: itemId, isCompleted: false }

		mockTx.shoppingListItem.findFirst = vi.fn().mockResolvedValue(existingItem)
		mockTx.shoppingListItem.update = vi.fn().mockResolvedValue({})

		await handleCompleteAction(mockTx, userId, action)

		expect(mockTx.shoppingListItem.findFirst).toHaveBeenCalledWith({
			where: {
				userId,
				name: {
					equals: lowerCaseName,
					mode: 'insensitive',
				},
			},
		})
	})
})

describe('Edge cases and error handling', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	test('should handle database errors gracefully', async () => {
		const action = {
			action: 'add' as const,
			name: itemName,
			amount: defaultAmount,
		}
		const dbError = new Error('Database connection failed')

		mockTx.shoppingListItem.findFirst = vi.fn().mockRejectedValue(dbError)

		await expect(handleAddAction(mockTx, userId, action)).rejects.toThrow(
			'Database connection failed',
		)
	})

	test.each([
		{
			name: 'empty string names',
			itemName: '',
			amount: 1,
		},
		{
			name: 'special characters in item names',
			itemName: 'Café & Croissants',
			amount: 2,
		},
		{
			name: 'very large amounts',
			itemName: itemName,
			amount: 999999,
		},
	])('should handle $name', async ({ itemName: testItemName, amount }) => {
		const action = { action: 'add' as const, name: testItemName, amount }

		mockTx.shoppingListItem.findFirst = vi.fn().mockResolvedValue(null)
		mockTx.shoppingListItem.create = vi.fn().mockResolvedValue({})

		await handleAddAction(mockTx, userId, action)

		expect(mockTx.shoppingListItem.create).toHaveBeenCalledWith({
			data: {
				name: testItemName,
				amount,
				userId,
			},
		})
	})
})
