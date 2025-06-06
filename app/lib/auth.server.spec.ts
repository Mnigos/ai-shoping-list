import { vi } from 'vitest'
import { linkAnonymousAccount } from './auth.server'

const mockPrisma = vi.hoisted(() => ({
	$transaction: vi.fn(),
}))

// Mock prisma import
vi.mock('./prisma', () => ({
	prisma: mockPrisma,
}))

describe('Anonymous User Account Linking', () => {
	const anonymousUserId = 'anonymous-user-id'
	const newUserId = 'new-user-id'

	beforeEach(() => {
		vi.clearAllMocks()
	})

	test('should transfer shopping list items from anonymous user to new user', async () => {
		const anonymousItems = [
			{
				id: 'item-1',
				name: 'Apples',
				amount: 3,
				isCompleted: false,
				userId: anonymousUserId,
			},
			{
				id: 'item-2',
				name: 'Bread',
				amount: 1,
				isCompleted: true,
				userId: anonymousUserId,
			},
		]

		const mockTx = {
			shoppingListItem: {
				findMany: vi.fn().mockResolvedValue(anonymousItems),
				findFirst: vi.fn().mockResolvedValue(null),
				update: vi.fn().mockResolvedValue({}),
				delete: vi.fn().mockResolvedValue({}),
			},
		}

		mockPrisma.$transaction.mockImplementation(async (callback: any) => {
			return callback(mockTx)
		})

		await linkAnonymousAccount({
			anonymousUser: { user: { id: anonymousUserId } },
			newUser: { user: { id: newUserId } },
		})

		expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)

		expect(mockTx.shoppingListItem.findMany).toHaveBeenCalledWith({
			where: { userId: anonymousUserId },
		})

		expect(mockTx.shoppingListItem.findFirst).toHaveBeenCalledTimes(2)
		expect(mockTx.shoppingListItem.update).toHaveBeenCalledTimes(2)

		expect(mockTx.shoppingListItem.update).toHaveBeenCalledWith({
			where: { id: 'item-1' },
			data: { userId: newUserId },
		})
		expect(mockTx.shoppingListItem.update).toHaveBeenCalledWith({
			where: { id: 'item-2' },
			data: { userId: newUserId },
		})
	})

	test('should merge quantities when items with same name exist', async () => {
		const anonymousItems = [
			{
				id: 'anon-item-1',
				name: 'Apples',
				amount: 3,
				isCompleted: false,
				userId: anonymousUserId,
			},
		]

		const existingItem = {
			id: 'existing-item-1',
			name: 'Apples',
			amount: 2,
			isCompleted: false,
			userId: newUserId,
		}

		const mockTx = {
			shoppingListItem: {
				findMany: vi.fn().mockResolvedValue(anonymousItems),
				findFirst: vi.fn().mockResolvedValue(existingItem),
				update: vi.fn().mockResolvedValue({}),
				delete: vi.fn().mockResolvedValue({}),
			},
		}

		mockPrisma.$transaction.mockImplementation(async (callback: any) => {
			return callback(mockTx)
		})

		await linkAnonymousAccount({
			anonymousUser: { user: { id: anonymousUserId } },
			newUser: { user: { id: newUserId } },
		})

		expect(mockTx.shoppingListItem.update).toHaveBeenCalledWith({
			where: { id: 'existing-item-1' },
			data: {
				amount: 5,
				isCompleted: false,
			},
		})

		expect(mockTx.shoppingListItem.delete).toHaveBeenCalledWith({
			where: { id: 'anon-item-1' },
		})
	})

	test('should handle completion status correctly when merging', async () => {
		const anonymousItems = [
			{
				id: 'anon-item-1',
				name: 'Milk',
				amount: 1,
				isCompleted: true,
				userId: anonymousUserId,
			},
		]

		const existingItem = {
			id: 'existing-item-1',
			name: 'Milk',
			amount: 2,
			isCompleted: false,
			userId: newUserId,
		}

		const mockTx = {
			shoppingListItem: {
				findMany: vi.fn().mockResolvedValue(anonymousItems),
				findFirst: vi.fn().mockResolvedValue(existingItem),
				update: vi.fn().mockResolvedValue({}),
				delete: vi.fn().mockResolvedValue({}),
			},
		}

		mockPrisma.$transaction.mockImplementation(async (callback: any) => {
			return callback(mockTx)
		})

		await linkAnonymousAccount({
			anonymousUser: { user: { id: anonymousUserId } },
			newUser: { user: { id: newUserId } },
		})

		expect(mockTx.shoppingListItem.update).toHaveBeenCalledWith({
			where: { id: 'existing-item-1' },
			data: {
				amount: 3,
				isCompleted: true,
			},
		})

		expect(mockTx.shoppingListItem.delete).toHaveBeenCalledWith({
			where: { id: 'anon-item-1' },
		})
	})

	test('should handle case-insensitive name matching', async () => {
		const anonymousItems = [
			{
				id: 'anon-item-1',
				name: 'BANANAS',
				amount: 5,
				isCompleted: false,
				userId: anonymousUserId,
			},
		]

		const existingItem = {
			id: 'existing-item-1',
			name: 'bananas',
			amount: 3,
			isCompleted: false,
			userId: newUserId,
		}

		const mockTx = {
			shoppingListItem: {
				findMany: vi.fn().mockResolvedValue(anonymousItems),
				findFirst: vi.fn().mockResolvedValue(existingItem),
				update: vi.fn().mockResolvedValue({}),
				delete: vi.fn().mockResolvedValue({}),
			},
		}

		mockPrisma.$transaction.mockImplementation(async (callback: any) => {
			return callback(mockTx)
		})

		await linkAnonymousAccount({
			anonymousUser: { user: { id: anonymousUserId } },
			newUser: { user: { id: newUserId } },
		})

		expect(mockTx.shoppingListItem.findFirst).toHaveBeenCalledWith({
			where: {
				userId: newUserId,
				name: {
					equals: 'BANANAS',
					mode: 'insensitive',
				},
			},
		})

		expect(mockTx.shoppingListItem.update).toHaveBeenCalledWith({
			where: { id: 'existing-item-1' },
			data: {
				amount: 8,
				isCompleted: false,
			},
		})
	})
})
