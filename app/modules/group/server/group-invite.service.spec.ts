import { TRPCError } from '@trpc/server'
import { vi } from 'vitest'
import type { ProtectedContext } from '~/lib/trpc/t'
import {
	type GenerateInviteCodeInput,
	GroupInviteService,
	type JoinViaCodeInput,
	type ValidateInviteCodeInput,
} from './group-invite.service'

const mockPrisma = {
	group: {
		findUnique: vi.fn(),
		update: vi.fn(),
	},
	groupMember: {
		findUnique: vi.fn(),
		create: vi.fn(),
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
const groupId = 'group-123'
const groupName = 'Test Group'
const groupDescription = 'Test Description'

describe('GroupInviteService', () => {
	let service: GroupInviteService

	beforeEach(() => {
		vi.clearAllMocks()
		service = new GroupInviteService(mockContext)
	})

	describe('generateReadableInviteCode', () => {
		test('should generate a 6-character alphanumeric code', async () => {
			const code = await service.generateReadableInviteCode()

			expect(code).toHaveLength(6)
			expect(code).toMatch(/^[A-Za-z0-9]{6}$/)
		})

		test('should generate different codes on multiple calls', async () => {
			const codes = await Promise.all(
				Array.from({ length: 10 }, () => service.generateReadableInviteCode()),
			)
			const uniqueCodes = new Set(codes)

			// With 62^6 possible combinations, collisions should be extremely rare
			expect(uniqueCodes.size).toBe(codes.length)
		})
	})

	describe('ensureUniqueInviteCode', () => {
		test('should return code when no collision occurs', async () => {
			mockPrisma.group.findUnique.mockResolvedValue(null)

			const code = await service.ensureUniqueInviteCode()

			expect(code).toHaveLength(6)
			expect(code).toMatch(/^[A-Za-z0-9]{6}$/)
			expect(mockPrisma.group.findUnique).toHaveBeenCalledWith({
				where: { inviteCode: code },
				select: { id: true },
			})
		})

		test('should retry when collision occurs and eventually succeed', async () => {
			// First call returns existing group (collision), second call returns null (success)
			mockPrisma.group.findUnique
				.mockResolvedValueOnce({ id: 'existing-group' })
				.mockResolvedValueOnce(null)

			const code = await service.ensureUniqueInviteCode()

			expect(code).toHaveLength(6)
			expect(mockPrisma.group.findUnique).toHaveBeenCalledTimes(2)
		})

		test('should throw error after max retries', async () => {
			// Always return existing group (collision)
			mockPrisma.group.findUnique.mockResolvedValue({ id: 'existing-group' })

			await expect(service.ensureUniqueInviteCode(3)).rejects.toThrow(
				new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message:
						'Failed to generate unique invite code after multiple attempts',
				}),
			)

			expect(mockPrisma.group.findUnique).toHaveBeenCalledTimes(3)
		})
	})

	describe('validateInviteCodeExists', () => {
		const inviteCode = 'ABC123'

		test('should validate invite code successfully when user is not a member', async () => {
			const mockGroup = {
				id: groupId,
				name: groupName,
				description: groupDescription,
				isPersonal: false,
				createdAt: new Date('2023-01-01'),
				_count: {
					members: 3,
					shoppingListItems: 5,
				},
				members: [], // User is not a member
			}

			mockPrisma.group.findUnique.mockResolvedValue(mockGroup)

			const result = await service.validateInviteCodeExists(inviteCode, userId)

			expect(mockPrisma.group.findUnique).toHaveBeenCalledWith({
				where: { inviteCode },
				select: {
					id: true,
					name: true,
					description: true,
					isPersonal: true,
					createdAt: true,
					_count: {
						select: {
							members: true,
							shoppingListItems: true,
						},
					},
					members: {
						where: { userId },
						select: { id: true },
					},
				},
			})

			expect(result).toEqual({
				id: groupId,
				name: groupName,
				description: groupDescription,
				createdAt: mockGroup.createdAt,
				memberCount: 3,
				itemCount: 5,
				isAlreadyMember: false,
			})
		})

		test('should detect when user is already a member', async () => {
			const mockGroup = {
				id: groupId,
				name: groupName,
				description: groupDescription,
				isPersonal: false,
				createdAt: new Date('2023-01-01'),
				_count: {
					members: 3,
					shoppingListItems: 5,
				},
				members: [{ id: 'membership-id' }], // User is already a member
			}

			mockPrisma.group.findUnique.mockResolvedValue(mockGroup)

			const result = await service.validateInviteCodeExists(inviteCode, userId)

			expect(result.isAlreadyMember).toBe(true)
		})

		test('should handle null description', async () => {
			const mockGroup = {
				id: groupId,
				name: groupName,
				description: null,
				isPersonal: false,
				createdAt: new Date('2023-01-01'),
				_count: {
					members: 1,
					shoppingListItems: 0,
				},
				members: [],
			}

			mockPrisma.group.findUnique.mockResolvedValue(mockGroup)

			const result = await service.validateInviteCodeExists(inviteCode, userId)

			expect(result.description).toBeNull()
		})

		test('should throw NOT_FOUND for invalid invite code', async () => {
			mockPrisma.group.findUnique.mockResolvedValue(null)

			await expect(
				service.validateInviteCodeExists(inviteCode, userId),
			).rejects.toThrow(
				new TRPCError({
					code: 'NOT_FOUND',
					message: 'Invalid invite code',
				}),
			)
		})

		test('should throw BAD_REQUEST for personal groups', async () => {
			const mockGroup = {
				id: groupId,
				name: 'Personal Group',
				description: null,
				isPersonal: true,
				createdAt: new Date('2023-01-01'),
				_count: {
					members: 1,
					shoppingListItems: 0,
				},
				members: [],
			}

			mockPrisma.group.findUnique.mockResolvedValue(mockGroup)

			await expect(
				service.validateInviteCodeExists(inviteCode, userId),
			).rejects.toThrow(
				new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Cannot join personal groups',
				}),
			)
		})
	})

	describe('generateInviteCode', () => {
		const validInput: GenerateInviteCodeInput = { groupId }

		test('should generate new invite code for group admin', async () => {
			const mockMembership = {
				role: 'ADMIN',
				group: { isPersonal: false },
			}
			const mockUpdatedGroup = {
				id: groupId,
				name: groupName,
				description: groupDescription,
				inviteCode: 'ABC123',
				isPersonal: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			mockPrisma.groupMember.findUnique.mockResolvedValue(mockMembership)
			mockPrisma.group.findUnique.mockResolvedValue(null) // For ensureUniqueInviteCode
			mockPrisma.group.update.mockResolvedValue(mockUpdatedGroup)

			const result = await service.generateInviteCode(validInput)

			expect(mockPrisma.groupMember.findUnique).toHaveBeenCalledWith({
				where: {
					userId_groupId: {
						userId,
						groupId,
					},
				},
				select: {
					role: true,
					group: {
						select: {
							isPersonal: true,
						},
					},
				},
			})

			expect(mockPrisma.group.update).toHaveBeenCalledWith({
				where: { id: groupId },
				data: { inviteCode: expect.any(String) },
				select: {
					id: true,
					name: true,
					description: true,
					inviteCode: true,
					isPersonal: true,
					createdAt: true,
					updatedAt: true,
				},
			})

			expect(result).toEqual(mockUpdatedGroup)
		})

		test('should throw NOT_FOUND when user is not a member', async () => {
			mockPrisma.groupMember.findUnique.mockResolvedValue(null)

			await expect(service.generateInviteCode(validInput)).rejects.toThrow(
				new TRPCError({
					code: 'NOT_FOUND',
					message: 'Group not found or you are not a member',
				}),
			)
		})

		test('should throw FORBIDDEN when user is not an admin', async () => {
			const mockMembership = {
				role: 'MEMBER',
				group: { isPersonal: false },
			}

			mockPrisma.groupMember.findUnique.mockResolvedValue(mockMembership)

			await expect(service.generateInviteCode(validInput)).rejects.toThrow(
				new TRPCError({
					code: 'FORBIDDEN',
					message: 'Only group admins can generate invite codes',
				}),
			)
		})

		test('should throw BAD_REQUEST for personal groups', async () => {
			const mockMembership = {
				role: 'ADMIN',
				group: { isPersonal: true },
			}

			mockPrisma.groupMember.findUnique.mockResolvedValue(mockMembership)

			await expect(service.generateInviteCode(validInput)).rejects.toThrow(
				new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Personal groups cannot have invite codes',
				}),
			)
		})
	})

	describe('validateInviteCode', () => {
		const validInput: ValidateInviteCodeInput = { inviteCode: 'ABC123' }

		test('should validate invite code successfully', async () => {
			const mockGroup = {
				id: groupId,
				name: groupName,
				description: groupDescription,
				isPersonal: false,
				createdAt: new Date(),
				_count: {
					members: 3,
					shoppingListItems: 5,
				},
				members: [], // User is not a member
			}

			mockPrisma.group.findUnique.mockResolvedValue(mockGroup)

			const result = await service.validateInviteCode(validInput)

			expect(result).toEqual({
				id: groupId,
				name: groupName,
				description: groupDescription,
				createdAt: mockGroup.createdAt,
				memberCount: 3,
				itemCount: 5,
				isAlreadyMember: false,
			})
		})
	})

	describe('joinViaCode', () => {
		const validInput: JoinViaCodeInput = { inviteCode: 'ABC123' }

		test('should join group successfully', async () => {
			const mockGroup = {
				id: groupId,
				name: groupName,
				description: groupDescription,
				isPersonal: false,
				createdAt: new Date(),
				_count: {
					members: 2,
					shoppingListItems: 3,
				},
				members: [], // User is not a member
			}

			const mockGroupDetails = {
				id: groupId,
				name: groupName,
				description: groupDescription,
				inviteCode: 'ABC123',
				isPersonal: false,
				createdAt: new Date(),
				updatedAt: new Date(),
				members: [],
				_count: { shoppingListItems: 3 },
			}

			// Mock the validateInviteCodeExists call
			mockPrisma.group.findUnique
				.mockResolvedValueOnce(mockGroup)
				.mockResolvedValueOnce(mockGroupDetails)

			// Mock the groupMember.create call
			mockPrisma.groupMember.create.mockResolvedValue({})

			const result = await service.joinViaCode(validInput)

			expect(mockPrisma.groupMember.create).toHaveBeenCalledWith({
				data: {
					userId,
					groupId,
					role: 'MEMBER',
				},
			})

			expect(result).toEqual({
				...mockGroupDetails,
				myRole: 'MEMBER',
			})
		})

		test('should throw CONFLICT when user is already a member', async () => {
			const mockGroup = {
				id: groupId,
				name: groupName,
				description: groupDescription,
				isPersonal: false,
				createdAt: new Date(),
				_count: {
					members: 2,
					shoppingListItems: 3,
				},
				members: [{ id: 'membership-id' }], // User is already a member
			}

			mockPrisma.group.findUnique.mockResolvedValue(mockGroup)

			await expect(service.joinViaCode(validInput)).rejects.toThrow(
				new TRPCError({
					code: 'CONFLICT',
					message: 'You are already a member of this group',
				}),
			)
		})

		test('should handle database constraint errors', async () => {
			const mockGroup = {
				id: groupId,
				name: groupName,
				description: groupDescription,
				isPersonal: false,
				createdAt: new Date(),
				_count: {
					members: 2,
					shoppingListItems: 3,
				},
				members: [], // User is not a member
			}

			mockPrisma.group.findUnique.mockResolvedValue(mockGroup)

			// Simulate a unique constraint violation (P2002)
			const constraintError = new Error('Unique constraint violation')
			;(constraintError as any).code = 'P2002'
			mockPrisma.groupMember.create.mockRejectedValue(constraintError)

			await expect(service.joinViaCode(validInput)).rejects.toThrow(
				new TRPCError({
					code: 'CONFLICT',
					message: 'You are already a member of this group',
				}),
			)
		})
	})
})
