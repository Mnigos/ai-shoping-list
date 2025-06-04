import { TRPCError } from '@trpc/server'
import { vi } from 'vitest'
import type { ProtectedContext } from '~/lib/trpc/t'
import { ShoppingListActionsService } from './shopping-list-action.service'
import {
	type AddItemInput,
	type DeleteItemInput,
	type ExecuteActionsInput,
	ShoppingListService,
	type ToggleCompleteInput,
	type UpdateItemInput,
} from './shopping-list.service'

const mockPrisma = {
	shoppingListItem: {
		findMany: vi.fn(),
		findUnique: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	},
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

describe('ShoppingListService', () => {
	let service: ShoppingListService

	beforeEach(() => {
		vi.clearAllMocks()
		service = new ShoppingListService(mockContext)
	})

	describe('getItems', () => {
		test('should fetch all items for the current user ordered by creation date', async () => {
			const mockItems = [
				{
					id: 'item-1',
					name: 'Item 1',
					amount: 2,
					userId,
					createdAt: new Date('2023-01-02'),
				},
				{
					id: 'item-2',
					name: 'Item 2',
					amount: 1,
					userId,
					createdAt: new Date('2023-01-01'),
				},
			]

			mockPrisma.shoppingListItem.findMany.mockResolvedValue(mockItems)

			const result = await service.getItems()

			expect(mockPrisma.shoppingListItem.findMany).toHaveBeenCalledWith({
				where: { userId },
				orderBy: { createdAt: 'desc' },
			})
			expect(result).toEqual(mockItems)
		})

		test('should return empty array when no items exist', async () => {
			mockPrisma.shoppingListItem.findMany.mockResolvedValue([])

			const result = await service.getItems()

			expect(result).toEqual([])
		})
	})

	describe('executeActions', () => {
		test('should delegate to actions service', async () => {
			const mockActions = [
				{ action: 'add' as const, name: itemName, amount: defaultAmount },
			]
			const input: ExecuteActionsInput = { actions: mockActions }
			const mockResult = [{ id: itemId, name: itemName, amount: defaultAmount }]

			const executeSpy = vi.spyOn(
				ShoppingListActionsService.prototype,
				'execute',
			)
			executeSpy.mockResolvedValue(mockResult as any)

			const result = await service.executeActions(input)

			expect(executeSpy).toHaveBeenCalledWith(mockActions)
			expect(result).toEqual(mockResult)
		})
	})

	describe('addItem', () => {
		const validInput: AddItemInput = {
			name: itemName,
			amount: defaultAmount,
		}

		test('should create a new item successfully', async () => {
			const mockCreatedItem = {
				id: itemId,
				name: itemName,
				amount: defaultAmount,
				userId,
				isCompleted: false,
				createdAt: new Date(),
			}

			mockPrisma.shoppingListItem.create.mockResolvedValue(mockCreatedItem)

			const result = await service.addItem(validInput)

			expect(mockPrisma.shoppingListItem.create).toHaveBeenCalledWith({
				data: {
					name: itemName,
					amount: defaultAmount,
					userId,
				},
			})
			expect(result).toEqual(mockCreatedItem)
		})

		test('should rethrow other database errors', async () => {
			const genericError = new Error('Database connection failed')

			mockPrisma.shoppingListItem.create.mockRejectedValue(genericError)

			await expect(service.addItem(validInput)).rejects.toThrow(
				'Database connection failed',
			)
		})
	})

	describe('updateItem', () => {
		const validInput: UpdateItemInput = {
			id: itemId,
			amount: 10,
		}

		test('should update item amount successfully', async () => {
			const mockUpdatedItem = {
				id: itemId,
				name: itemName,
				amount: 10,
				userId,
				isCompleted: false,
			}

			mockPrisma.shoppingListItem.update.mockResolvedValue(mockUpdatedItem)

			const result = await service.updateItem(validInput)

			expect(mockPrisma.shoppingListItem.update).toHaveBeenCalledWith({
				where: { id: itemId, userId },
				data: { amount: 10 },
			})
			expect(result).toEqual(mockUpdatedItem)
		})

		test('should handle item not found during update', async () => {
			const notFoundError = new Error('Record not found')
			;(notFoundError as any).code = 'P2025'

			mockPrisma.shoppingListItem.update.mockRejectedValue(notFoundError)

			await expect(service.updateItem(validInput)).rejects.toThrow(
				'Record not found',
			)
		})
	})

	describe('toggleComplete', () => {
		const validInput: ToggleCompleteInput = { id: itemId }

		test.each([
			{
				description: 'should toggle item from incomplete to complete',
				currentStatus: false,
				expectedStatus: true,
			},
			{
				description: 'should toggle item from complete to incomplete',
				currentStatus: true,
				expectedStatus: false,
			},
		])('$description', async ({ currentStatus, expectedStatus }) => {
			const mockItem = {
				id: itemId,
				name: itemName,
				amount: defaultAmount,
				userId,
				isCompleted: currentStatus,
			}

			const mockUpdatedItem = { ...mockItem, isCompleted: expectedStatus }

			mockPrisma.shoppingListItem.findUnique.mockResolvedValue(mockItem)
			mockPrisma.shoppingListItem.update.mockResolvedValue(mockUpdatedItem)

			const result = await service.toggleComplete(validInput)

			expect(mockPrisma.shoppingListItem.findUnique).toHaveBeenCalledWith({
				where: { id: itemId, userId },
			})
			expect(mockPrisma.shoppingListItem.update).toHaveBeenCalledWith({
				where: { id: itemId, userId },
				data: { isCompleted: expectedStatus },
			})
			expect(result).toEqual(mockUpdatedItem)
		})

		test('should throw NOT_FOUND error when item does not exist', async () => {
			mockPrisma.shoppingListItem.findUnique.mockResolvedValue(null)

			await expect(service.toggleComplete(validInput)).rejects.toThrow(
				TRPCError,
			)

			try {
				await service.toggleComplete(validInput)
			} catch (error) {
				expect(error).toBeInstanceOf(TRPCError)
				expect((error as TRPCError).code).toBe('NOT_FOUND')
				expect((error as TRPCError).message).toBe('Item not found')
			}
		})
	})

	describe('deleteItem', () => {
		const validInput: DeleteItemInput = { id: itemId }

		test('should delete item successfully', async () => {
			const mockDeletedItem = {
				id: itemId,
				name: itemName,
				amount: defaultAmount,
				userId,
				isCompleted: false,
			}

			mockPrisma.shoppingListItem.delete.mockResolvedValue(mockDeletedItem)

			const result = await service.deleteItem(validInput)

			expect(mockPrisma.shoppingListItem.delete).toHaveBeenCalledWith({
				where: { id: itemId, userId },
			})
			expect(result).toEqual(mockDeletedItem)
		})

		test('should handle item not found during deletion', async () => {
			const notFoundError = new Error('Record not found')
			;(notFoundError as any).code = 'P2025'

			mockPrisma.shoppingListItem.delete.mockRejectedValue(notFoundError)

			await expect(service.deleteItem(validInput)).rejects.toThrow(
				'Record not found',
			)
		})
	})

	describe('input validation scenarios', () => {
		test.each([
			{
				description: 'should handle empty string names in addItem',
				input: { name: '', amount: 1 },
			},
			{
				description: 'should handle special characters in item names',
				input: { name: 'Café & Croissants 🥐', amount: 2 },
			},
			{
				description: 'should handle very long item names',
				input: { name: 'A'.repeat(500), amount: 1 },
			},
		])('$description', async ({ input }) => {
			const mockCreatedItem = { id: itemId, ...input, userId }
			mockPrisma.shoppingListItem.create.mockResolvedValue(mockCreatedItem)

			await service.addItem(input as AddItemInput)

			expect(mockPrisma.shoppingListItem.create).toHaveBeenCalledWith({
				data: { ...input, userId },
			})
		})

		test.each([
			{
				description: 'should handle maximum integer amounts',
				amount: Number.MAX_SAFE_INTEGER,
			},
			{
				description: 'should handle minimum valid amounts',
				amount: 1,
			},
		])('$description', async ({ amount }) => {
			const input = { name: itemName, amount }
			const mockCreatedItem = { id: itemId, ...input, userId }
			mockPrisma.shoppingListItem.create.mockResolvedValue(mockCreatedItem)

			await service.addItem(input)

			expect(mockPrisma.shoppingListItem.create).toHaveBeenCalledWith({
				data: { ...input, userId },
			})
		})
	})
})
