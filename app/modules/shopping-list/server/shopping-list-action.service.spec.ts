import { vi } from 'vitest'
import type { ProtectedContext } from '~/lib/trpc/t'
import {
	type PrismaTransaction,
	type ShoppingListActionSchema,
	ShoppingListActionsService,
} from './shopping-list-action.service'

const mockShoppingListItem = {
	findFirst: vi.fn(),
	findMany: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	delete: vi.fn(),
}

const mockTx = {
	shoppingListItem: mockShoppingListItem,
} as unknown as PrismaTransaction

const mockPrisma = {
	$transaction: vi.fn(),
}

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

const mockContext: ProtectedContext = {
	user: mockUser,
	prisma: mockPrisma as any,
	env: {} as any,
}

const userId = mockUser.id
const itemId = 'item-123'
const itemName = 'Test Item'
const defaultAmount = 5

const mockTransactionExecution = () => {
	mockPrisma.$transaction.mockImplementation(async (callback: any) => {
		return callback(mockTx)
	})
}

describe('ShoppingListActionsService', () => {
	let service: ShoppingListActionsService

	beforeEach(() => {
		vi.clearAllMocks()
		service = new ShoppingListActionsService(mockContext)
	})

	describe('execute', () => {
		test('should execute multiple actions in a transaction', async () => {
			const actions: ShoppingListActionSchema[] = [
				{ action: 'add', name: 'Item 1', amount: 2 },
				{ action: 'add', name: 'Item 2', amount: 1 },
			]

			const mockResult = [
				{ id: 'item-1', name: 'Item 1', amount: 2, userId },
				{ id: 'item-2', name: 'Item 2', amount: 1, userId },
			]

			mockShoppingListItem.findMany.mockResolvedValue(mockResult)
			mockTransactionExecution()

			const result = await service.execute(actions)

			expect(mockPrisma.$transaction).toHaveBeenCalledWith(expect.any(Function))
			expect(mockShoppingListItem.findMany).toHaveBeenCalledWith({
				where: { userId },
				orderBy: { createdAt: 'desc' },
			})
			expect(result).toEqual(mockResult)
		})

		test('should handle empty actions array', async () => {
			const actions: ShoppingListActionSchema[] = []
			const mockResult: any[] = []

			mockShoppingListItem.findMany.mockResolvedValue(mockResult)
			mockTransactionExecution()

			const result = await service.execute(actions)

			expect(result).toEqual(mockResult)
		})
	})

	describe('handleAddAction', () => {
		test('should throw error for invalid action type', async () => {
			const action = { action: 'delete', name: itemName } as any

			await expect(
				service.handleAddAction({ tx: mockTx, userId, action }),
			).rejects.toThrow('Invalid action type for handleAddAction')
		})

		test('should create new item when it does not exist', async () => {
			const action = {
				action: 'add' as const,
				name: itemName,
				amount: defaultAmount,
			}

			mockShoppingListItem.findFirst.mockResolvedValue(null)
			mockShoppingListItem.create.mockResolvedValue({})

			await service.handleAddAction({ tx: mockTx, userId, action })

			expect(mockShoppingListItem.findFirst).toHaveBeenCalledWith({
				where: {
					userId,
					name: {
						equals: itemName,
						mode: 'insensitive',
					},
				},
			})

			expect(mockShoppingListItem.create).toHaveBeenCalledWith({
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
			const action = {
				action: 'add' as const,
				name: itemName,
				amount: addAmount,
			}
			const existingItem = { id: itemId, amount: existingAmount }

			mockShoppingListItem.findFirst.mockResolvedValue(existingItem)
			mockShoppingListItem.update.mockResolvedValue({})

			await service.handleAddAction({ tx: mockTx, userId, action })

			expect(mockShoppingListItem.update).toHaveBeenCalledWith({
				where: { id: itemId },
				data: { amount: expectedTotal },
			})
		})

		test('should handle case-insensitive name matching', async () => {
			const upperCaseName = 'APPLES'
			const action = { action: 'add' as const, name: upperCaseName, amount: 1 }

			mockShoppingListItem.findFirst.mockResolvedValue(null)
			mockShoppingListItem.create.mockResolvedValue({})

			await service.handleAddAction({ tx: mockTx, userId, action })

			expect(mockShoppingListItem.findFirst).toHaveBeenCalledWith({
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
		test('should throw error for invalid action type', async () => {
			const action = { action: 'delete', name: itemName } as any

			await expect(
				service.handleUpdateAction({ tx: mockTx, userId, action }),
			).rejects.toThrow('Invalid action type for handleUpdateAction')
		})

		test('should throw error when item does not exist', async () => {
			const action = {
				action: 'update' as const,
				name: itemName,
				amount: defaultAmount,
			}

			mockShoppingListItem.findFirst.mockResolvedValue(null)

			await expect(
				service.handleUpdateAction({ tx: mockTx, userId, action }),
			).rejects.toThrow(`Item "${itemName}" not found`)
		})

		test('should update existing item with new amount', async () => {
			const newAmount = 10
			const action = {
				action: 'update' as const,
				name: itemName,
				amount: newAmount,
			}
			const existingItem = { id: itemId, amount: defaultAmount }

			mockShoppingListItem.findFirst.mockResolvedValue(existingItem)
			mockShoppingListItem.update.mockResolvedValue({})

			await service.handleUpdateAction({ tx: mockTx, userId, action })

			expect(mockShoppingListItem.findFirst).toHaveBeenCalledWith({
				where: {
					userId,
					name: {
						equals: itemName,
						mode: 'insensitive',
					},
				},
			})

			expect(mockShoppingListItem.update).toHaveBeenCalledWith({
				where: { id: itemId },
				data: { amount: newAmount },
			})
		})
	})

	describe('handleDeleteAction', () => {
		test('should throw error when item does not exist', async () => {
			const action = { action: 'delete' as const, name: itemName }

			mockShoppingListItem.findFirst.mockResolvedValue(null)

			await expect(
				service.handleDeleteAction({ tx: mockTx, userId, action }),
			).rejects.toThrow(`Item "${itemName}" not found`)
		})

		test('should delete existing item', async () => {
			const action = { action: 'delete' as const, name: itemName }
			const existingItem = { id: itemId }

			mockShoppingListItem.findFirst.mockResolvedValue(existingItem)
			mockShoppingListItem.delete.mockResolvedValue({})

			await service.handleDeleteAction({ tx: mockTx, userId, action })

			expect(mockShoppingListItem.findFirst).toHaveBeenCalledWith({
				where: {
					userId,
					name: {
						equals: itemName,
						mode: 'insensitive',
					},
				},
			})

			expect(mockShoppingListItem.delete).toHaveBeenCalledWith({
				where: { id: itemId },
			})
		})
	})

	describe('handleCompleteAction', () => {
		test('should throw error when item does not exist', async () => {
			const action = { action: 'complete' as const, name: itemName }

			mockShoppingListItem.findFirst.mockResolvedValue(null)

			await expect(
				service.handleCompleteAction({ tx: mockTx, userId, action }),
			).rejects.toThrow(`Item "${itemName}" not found`)
		})

		test.each([
			{
				description: 'should toggle completion status from false to true',
				isCompleted: false,
				expectedResult: true,
			},
			{
				description: 'should toggle completion status from true to false',
				isCompleted: true,
				expectedResult: false,
			},
		])('$description', async ({ isCompleted, expectedResult }) => {
			const action = { action: 'complete' as const, name: itemName }
			const existingItem = { id: itemId, isCompleted }

			mockShoppingListItem.findFirst.mockResolvedValue(existingItem)
			mockShoppingListItem.update.mockResolvedValue({})

			await service.handleCompleteAction({ tx: mockTx, userId, action })

			expect(mockShoppingListItem.findFirst).toHaveBeenCalledWith({
				where: {
					userId,
					name: {
						equals: itemName,
						mode: 'insensitive',
					},
				},
			})

			expect(mockShoppingListItem.update).toHaveBeenCalledWith({
				where: { id: itemId },
				data: { isCompleted: expectedResult },
			})
		})
	})

	describe('edge cases and error handling', () => {
		test('should handle database errors gracefully', async () => {
			const action = {
				action: 'add' as const,
				name: itemName,
				amount: defaultAmount,
			}
			const dbError = new Error('Database connection failed')

			mockShoppingListItem.findFirst.mockRejectedValue(dbError)

			await expect(
				service.handleAddAction({ tx: mockTx, userId, action }),
			).rejects.toThrow('Database connection failed')
		})

		test.each([
			{
				description: 'should handle empty string names',
				itemName: '',
				amount: 1,
			},
			{
				description: 'should handle special characters in item names',
				itemName: 'Café & Croissants',
				amount: 2,
			},
			{
				description: 'should handle very large amounts',
				itemName: 'Test Item',
				amount: 999999,
			},
		])('$description', async ({ itemName: testItemName, amount }) => {
			const action = { action: 'add' as const, name: testItemName, amount }

			mockShoppingListItem.findFirst.mockResolvedValue(null)
			mockShoppingListItem.create.mockResolvedValue({})

			await service.handleAddAction({ tx: mockTx, userId, action })

			expect(mockShoppingListItem.create).toHaveBeenCalledWith({
				data: {
					name: testItemName,
					amount,
					userId,
				},
			})
		})

		test('should execute actions in correct order', async () => {
			const actions = [
				{ action: 'add' as const, name: 'Item 1', amount: 2 },
				{ action: 'update' as const, name: 'Item 1', amount: 5 },
				{ action: 'complete' as const, name: 'Item 1' },
			]

			const existingItem = { id: itemId, amount: 2, isCompleted: false }

			mockShoppingListItem.findFirst
				.mockResolvedValueOnce(null) // For add action
				.mockResolvedValueOnce(existingItem) // For update action
				.mockResolvedValueOnce({ ...existingItem, amount: 5 }) // For complete action

			mockShoppingListItem.create.mockResolvedValue(existingItem)
			mockShoppingListItem.update.mockResolvedValue({})
			mockShoppingListItem.findMany.mockResolvedValue([])

			mockTransactionExecution()

			await service.execute(actions)

			expect(mockShoppingListItem.create).toHaveBeenCalledTimes(1)
			expect(mockShoppingListItem.update).toHaveBeenCalledTimes(2)
		})
	})
})
