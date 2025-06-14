import { vi } from 'vitest'
import type { PrismaTransaction } from '~/shared/types/prisma'
import { ensurePersonalGroup } from './personal-group'

const mockUserModel = {
	findUnique: vi.fn(),
	update: vi.fn(),
}

const mockGroupModel = {
	create: vi.fn(),
}

const mockGroupMemberModel = {
	create: vi.fn(),
}

const mockTransaction = {
	user: mockUserModel,
	group: mockGroupModel,
	groupMember: mockGroupMemberModel,
} as unknown as PrismaTransaction

const userId = 'test-user-id'
const userName = 'Test User'
const personalGroupId = 'personal-group-id'
const personalGroupName = `${userName}'s Personal List`

const mockUser = {
	id: userId,
	name: userName,
}

const mockPersonalGroup = {
	id: personalGroupId,
	name: personalGroupName,
}

const mockUserWithPersonalGroup = {
	personalGroup: mockPersonalGroup,
}

describe('ensurePersonalGroup', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('when user already has a personal group', () => {
		test('should return existing personal group without creating new one', async () => {
			mockUserModel.findUnique.mockResolvedValue(mockUserWithPersonalGroup)

			const result = await ensurePersonalGroup(mockTransaction, userId)

			expect(mockUserModel.findUnique).toHaveBeenCalledWith({
				where: { id: userId },
				select: { personalGroup: true },
			})
			expect(mockUserModel.findUnique).toHaveBeenCalledTimes(1)
			expect(mockGroupModel.create).not.toHaveBeenCalled()
			expect(mockGroupMemberModel.create).not.toHaveBeenCalled()
			expect(mockUserModel.update).not.toHaveBeenCalled()
			expect(result).toEqual(mockPersonalGroup)
		})
	})

	describe('when user does not have a personal group', () => {
		test('should create new personal group and return it', async () => {
			mockUserModel.findUnique
				.mockResolvedValueOnce({ personalGroup: null })
				.mockResolvedValueOnce(mockUser)
			mockGroupModel.create.mockResolvedValue(mockPersonalGroup)
			mockGroupMemberModel.create.mockResolvedValue({})
			mockUserModel.update.mockResolvedValue({})

			const result = await ensurePersonalGroup(mockTransaction, userId)

			expect(mockUserModel.findUnique).toHaveBeenCalledTimes(2)
			expect(mockUserModel.findUnique).toHaveBeenNthCalledWith(1, {
				where: { id: userId },
				select: { personalGroup: true },
			})
			expect(mockUserModel.findUnique).toHaveBeenNthCalledWith(2, {
				where: { id: userId },
				select: { id: true, name: true },
			})

			expect(mockGroupModel.create).toHaveBeenCalledWith({
				data: {
					name: personalGroupName,
					description: 'Your personal shopping list',
					isPersonal: true,
				},
				select: { id: true, name: true },
			})

			expect(mockGroupMemberModel.create).toHaveBeenCalledWith({
				data: {
					userId: userId,
					groupId: personalGroupId,
					role: 'ADMIN',
				},
			})

			expect(mockUserModel.update).toHaveBeenCalledWith({
				where: { id: userId },
				data: { personalGroupId: personalGroupId },
			})

			expect(result).toEqual(mockPersonalGroup)
		})

		test('should handle user with undefined personalGroup', async () => {
			mockUserModel.findUnique
				.mockResolvedValueOnce({ personalGroup: undefined })
				.mockResolvedValueOnce(mockUser)
			mockGroupModel.create.mockResolvedValue(mockPersonalGroup)
			mockGroupMemberModel.create.mockResolvedValue({})
			mockUserModel.update.mockResolvedValue({})

			const result = await ensurePersonalGroup(mockTransaction, userId)

			expect(mockGroupModel.create).toHaveBeenCalled()
			expect(result).toEqual(mockPersonalGroup)
		})

		test('should handle user with falsy personalGroup', async () => {
			mockUserModel.findUnique
				.mockResolvedValueOnce({ personalGroup: false })
				.mockResolvedValueOnce(mockUser)
			mockGroupModel.create.mockResolvedValue(mockPersonalGroup)
			mockGroupMemberModel.create.mockResolvedValue({})
			mockUserModel.update.mockResolvedValue({})

			const result = await ensurePersonalGroup(mockTransaction, userId)

			expect(mockGroupModel.create).toHaveBeenCalled()
			expect(result).toEqual(mockPersonalGroup)
		})
	})

	describe('error handling', () => {
		test('should throw error when user is not found in first query', async () => {
			mockUserModel.findUnique
				.mockResolvedValueOnce(null)
				.mockResolvedValueOnce(null)

			await expect(
				ensurePersonalGroup(mockTransaction, userId),
			).rejects.toThrow('User not found')

			expect(mockUserModel.findUnique).toHaveBeenCalledTimes(2)
			expect(mockGroupModel.create).not.toHaveBeenCalled()
		})

		test('should throw error when user is not found in second query', async () => {
			mockUserModel.findUnique
				.mockResolvedValueOnce({ personalGroup: null })
				.mockResolvedValueOnce(null)

			await expect(
				ensurePersonalGroup(mockTransaction, userId),
			).rejects.toThrow('User not found')

			expect(mockUserModel.findUnique).toHaveBeenCalledTimes(2)
			expect(mockGroupModel.create).not.toHaveBeenCalled()
		})

		test('should propagate database errors from group creation', async () => {
			const databaseError = new Error('Database connection failed')
			mockUserModel.findUnique
				.mockResolvedValueOnce({ personalGroup: null })
				.mockResolvedValueOnce(mockUser)
			mockGroupModel.create.mockRejectedValue(databaseError)

			await expect(
				ensurePersonalGroup(mockTransaction, userId),
			).rejects.toThrow('Database connection failed')

			expect(mockGroupModel.create).toHaveBeenCalled()
			expect(mockGroupMemberModel.create).not.toHaveBeenCalled()
		})

		test('should propagate database errors from group member creation', async () => {
			const databaseError = new Error('Foreign key constraint failed')
			mockUserModel.findUnique
				.mockResolvedValueOnce({ personalGroup: null })
				.mockResolvedValueOnce(mockUser)
			mockGroupModel.create.mockResolvedValue(mockPersonalGroup)
			mockGroupMemberModel.create.mockRejectedValue(databaseError)

			await expect(
				ensurePersonalGroup(mockTransaction, userId),
			).rejects.toThrow('Foreign key constraint failed')

			expect(mockGroupMemberModel.create).toHaveBeenCalled()
			expect(mockUserModel.update).not.toHaveBeenCalled()
		})

		test('should propagate database errors from user update', async () => {
			const databaseError = new Error('Update constraint failed')
			mockUserModel.findUnique
				.mockResolvedValueOnce({ personalGroup: null })
				.mockResolvedValueOnce(mockUser)
			mockGroupModel.create.mockResolvedValue(mockPersonalGroup)
			mockGroupMemberModel.create.mockResolvedValue({})
			mockUserModel.update.mockRejectedValue(databaseError)

			await expect(
				ensurePersonalGroup(mockTransaction, userId),
			).rejects.toThrow('Update constraint failed')

			expect(mockUserModel.update).toHaveBeenCalled()
		})
	})

	describe('edge cases', () => {
		test.each([
			{
				description: 'should handle user with special characters in name',
				name: 'José María',
			},
			{ description: 'should handle user with emoji in name', name: 'User 🎉' },
			{
				description: 'should handle user with very long name',
				name: 'A'.repeat(100),
			},
			{
				description: 'should handle user with single character name',
				name: 'A',
			},
		])('$description', async ({ name }) => {
			const userWithSpecialName = { id: userId, name }
			const expectedGroupName = `${name}'s Personal List`

			mockUserModel.findUnique
				.mockResolvedValueOnce({ personalGroup: null })
				.mockResolvedValueOnce(userWithSpecialName)
			mockGroupModel.create.mockResolvedValue({
				id: personalGroupId,
				name: expectedGroupName,
			})
			mockGroupMemberModel.create.mockResolvedValue({})
			mockUserModel.update.mockResolvedValue({})

			const result = await ensurePersonalGroup(mockTransaction, userId)

			expect(mockGroupModel.create).toHaveBeenCalledWith({
				data: {
					name: expectedGroupName,
					description: 'Your personal shopping list',
					isPersonal: true,
				},
				select: { id: true, name: true },
			})
			expect(result.name).toBe(expectedGroupName)
		})

		test('should handle different user ID formats', async () => {
			const differentUserIds = [
				'cuid-format-id',
				'uuid-12345678-1234-1234-1234-123456789012',
				'short-id',
			]

			for (const testUserId of differentUserIds) {
				vi.clearAllMocks()

				mockUserModel.findUnique
					.mockResolvedValueOnce({ personalGroup: null })
					.mockResolvedValueOnce({ id: testUserId, name: userName })
				mockGroupModel.create.mockResolvedValue(mockPersonalGroup)
				mockGroupMemberModel.create.mockResolvedValue({})
				mockUserModel.update.mockResolvedValue({})

				await ensurePersonalGroup(mockTransaction, testUserId)

				expect(mockUserModel.findUnique).toHaveBeenCalledWith({
					where: { id: testUserId },
					select: { personalGroup: true },
				})
				expect(mockGroupMemberModel.create).toHaveBeenCalledWith({
					data: {
						userId: testUserId,
						groupId: personalGroupId,
						role: 'ADMIN',
					},
				})
			}
		})
	})

	describe('transaction behavior', () => {
		test('should use the provided transaction for all database operations', async () => {
			mockUserModel.findUnique
				.mockResolvedValueOnce({ personalGroup: null })
				.mockResolvedValueOnce(mockUser)
			mockGroupModel.create.mockResolvedValue(mockPersonalGroup)
			mockGroupMemberModel.create.mockResolvedValue({})
			mockUserModel.update.mockResolvedValue({})

			await ensurePersonalGroup(mockTransaction, userId)

			// Verify all operations use the same transaction object
			expect(mockUserModel.findUnique).toHaveBeenCalled()
			expect(mockGroupModel.create).toHaveBeenCalled()
			expect(mockGroupMemberModel.create).toHaveBeenCalled()
			expect(mockUserModel.update).toHaveBeenCalled()
		})

		test('should maintain operation order for data consistency', async () => {
			const operationOrder: string[] = []

			mockUserModel.findUnique.mockImplementationOnce(async () => {
				operationOrder.push('user.findUnique-1')
				return { personalGroup: null }
			})

			mockUserModel.findUnique.mockImplementationOnce(async () => {
				operationOrder.push('user.findUnique-2')
				return mockUser
			})

			mockGroupModel.create.mockImplementation(async () => {
				operationOrder.push('group.create')
				return mockPersonalGroup
			})

			mockGroupMemberModel.create.mockImplementation(async () => {
				operationOrder.push('groupMember.create')
				return {}
			})

			mockUserModel.update.mockImplementation(async () => {
				operationOrder.push('user.update')
				return {}
			})

			await ensurePersonalGroup(mockTransaction, userId)

			expect(operationOrder).toEqual([
				'user.findUnique-1',
				'user.findUnique-2',
				'group.create',
				'groupMember.create',
				'user.update',
			])
		})
	})
})
