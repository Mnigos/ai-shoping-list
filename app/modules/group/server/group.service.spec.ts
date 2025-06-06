import { TRPCError } from '@trpc/server'
import { vi } from 'vitest'
import type { ProtectedContext } from '~/lib/trpc/t'
import {
	type CreateGroupInput,
	type DeleteGroupInput,
	type GetGroupDetailsInput,
	GroupService,
	type UpdateGroupInput,
} from './group.service'

const mockPrisma = {
	group: {
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		findUnique: vi.fn(),
	},
	groupMember: {
		findMany: vi.fn(),
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

describe('GroupService', () => {
	let service: GroupService

	beforeEach(() => {
		vi.clearAllMocks()
		service = new GroupService(mockContext)
	})

	describe('getMyGroups', () => {
		test('should fetch all groups for the current user ordered by creation date', async () => {
			const mockGroupMemberships = [
				{
					role: 'ADMIN',
					group: {
						id: 'group-1',
						name: 'Group 1',
						description: 'Description 1',
						inviteCode: 'code-1',
						isPersonal: false,
						createdAt: new Date('2023-01-02'),
						updatedAt: new Date(),
						members: [
							{
								id: 'membership-1',
								role: 'ADMIN',
								joinedAt: new Date(),
								user: {
									id: userId,
									name: 'Test User',
									email: 'test@example.com',
									image: null,
								},
							},
						],
						_count: {
							shoppingListItems: 5,
						},
					},
				},
				{
					role: 'MEMBER',
					group: {
						id: 'group-2',
						name: 'Group 2',
						description: null,
						inviteCode: 'code-2',
						isPersonal: true,
						createdAt: new Date('2023-01-01'),
						updatedAt: new Date(),
						members: [
							{
								id: 'membership-2',
								role: 'MEMBER',
								joinedAt: new Date(),
								user: {
									id: userId,
									name: 'Test User',
									email: 'test@example.com',
									image: null,
								},
							},
						],
						_count: {
							shoppingListItems: 2,
						},
					},
				},
			]

			mockPrisma.groupMember.findMany.mockResolvedValue(mockGroupMemberships)

			const result = await service.getMyGroups()

			expect(mockPrisma.groupMember.findMany).toHaveBeenCalledWith({
				where: { userId },
				select: {
					role: true,
					group: {
						select: {
							id: true,
							name: true,
							description: true,
							inviteCode: true,
							isPersonal: true,
							createdAt: true,
							updatedAt: true,
							members: {
								select: {
									id: true,
									role: true,
									joinedAt: true,
									user: {
										select: {
											id: true,
											name: true,
											email: true,
											image: true,
										},
									},
								},
							},
							_count: {
								select: {
									shoppingListItems: true,
								},
							},
						},
					},
				},
				orderBy: {
					group: {
						createdAt: 'desc',
					},
				},
			})

			expect(result).toHaveLength(2)
			expect(result[0]).toEqual({
				...mockGroupMemberships[0].group,
				myRole: 'ADMIN',
			})
			expect(result[1]).toEqual({
				...mockGroupMemberships[1].group,
				myRole: 'MEMBER',
			})
		})

		test('should return empty array when user has no groups', async () => {
			mockPrisma.groupMember.findMany.mockResolvedValue([])

			const result = await service.getMyGroups()

			expect(result).toEqual([])
		})
	})

	describe('getGroupDetails', () => {
		const validInput: GetGroupDetailsInput = { id: groupId }

		test('should fetch group details successfully', async () => {
			const mockMembership = {
				role: 'ADMIN',
				group: {
					id: groupId,
					name: groupName,
					description: groupDescription,
					inviteCode: 'invite-code',
					isPersonal: false,
					createdAt: new Date(),
					updatedAt: new Date(),
					members: [
						{
							id: 'membership-1',
							role: 'ADMIN',
							joinedAt: new Date('2023-01-01'),
							user: {
								id: userId,
								name: 'Test User',
								email: 'test@example.com',
								image: null,
							},
						},
					],
					_count: {
						shoppingListItems: 3,
					},
				},
			}

			mockPrisma.groupMember.findUnique.mockResolvedValue(mockMembership)

			const result = await service.getGroupDetails(validInput)

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
							id: true,
							name: true,
							description: true,
							inviteCode: true,
							isPersonal: true,
							createdAt: true,
							updatedAt: true,
							members: {
								select: {
									id: true,
									role: true,
									joinedAt: true,
									user: {
										select: {
											id: true,
											name: true,
											email: true,
											image: true,
										},
									},
								},
								orderBy: {
									joinedAt: 'asc',
								},
							},
							_count: {
								select: {
									shoppingListItems: true,
								},
							},
						},
					},
				},
			})

			expect(result).toEqual({
				...mockMembership.group,
				myRole: 'ADMIN',
			})
		})

		test('should throw NOT_FOUND error when user is not a member', async () => {
			mockPrisma.groupMember.findUnique.mockResolvedValue(null)

			await expect(service.getGroupDetails(validInput)).rejects.toThrow(
				new TRPCError({
					code: 'NOT_FOUND',
					message: 'Group not found or you are not a member',
				}),
			)
		})
	})

	describe('createGroup', () => {
		const validInput: CreateGroupInput = {
			name: groupName,
			description: groupDescription,
		}

		test('should create group successfully', async () => {
			const mockCreatedGroup = {
				id: groupId,
				name: groupName,
				description: groupDescription,
				inviteCode: 'invite-code',
				isPersonal: false,
				createdAt: new Date(),
				updatedAt: new Date(),
				members: [
					{
						id: 'membership-1',
						role: 'ADMIN',
						joinedAt: new Date(),
						user: {
							id: userId,
							name: 'Test User',
							email: 'test@example.com',
							image: null,
						},
					},
				],
				_count: {
					shoppingListItems: 0,
				},
			}

			mockPrisma.group.create.mockResolvedValue(mockCreatedGroup)

			const result = await service.createGroup(validInput)

			expect(mockPrisma.group.create).toHaveBeenCalledWith({
				data: {
					name: groupName,
					description: groupDescription,
					members: {
						create: {
							userId,
							role: 'ADMIN',
						},
					},
				},
				select: {
					id: true,
					name: true,
					description: true,
					inviteCode: true,
					isPersonal: true,
					createdAt: true,
					updatedAt: true,
					members: {
						select: {
							id: true,
							role: true,
							joinedAt: true,
							user: {
								select: {
									id: true,
									name: true,
									email: true,
									image: true,
								},
							},
						},
					},
					_count: {
						select: {
							shoppingListItems: true,
						},
					},
				},
			})

			expect(result).toEqual({
				...mockCreatedGroup,
				myRole: 'ADMIN',
			})
		})

		test('should handle duplicate invite code error', async () => {
			const duplicateError = new Error('Unique constraint failed')
			;(duplicateError as any).code = 'P2002'

			mockPrisma.group.create.mockRejectedValue(duplicateError)

			await expect(service.createGroup(validInput)).rejects.toThrow(
				new TRPCError({
					code: 'CONFLICT',
					message:
						'A group with this invite code already exists. Please try again.',
				}),
			)
		})

		test('should rethrow other errors', async () => {
			const otherError = new Error('Database connection failed')
			mockPrisma.group.create.mockRejectedValue(otherError)

			await expect(service.createGroup(validInput)).rejects.toThrow(
				'Database connection failed',
			)
		})
	})

	describe('updateGroup', () => {
		const validInput: UpdateGroupInput = {
			id: groupId,
			name: 'Updated Group Name',
			description: 'Updated Description',
		}

		test('should update group successfully when user is admin', async () => {
			const mockMembership = {
				role: 'ADMIN',
			}

			const mockUpdatedGroup = {
				id: groupId,
				name: 'Updated Group Name',
				description: 'Updated Description',
				inviteCode: 'invite-code',
				isPersonal: false,
				createdAt: new Date(),
				updatedAt: new Date(),
				members: [
					{
						id: 'membership-1',
						role: 'ADMIN',
						joinedAt: new Date('2023-01-01'),
						user: {
							id: userId,
							name: 'Test User',
							email: 'test@example.com',
							image: null,
						},
					},
				],
				_count: {
					shoppingListItems: 3,
				},
			}

			mockPrisma.groupMember.findUnique.mockResolvedValue(mockMembership)
			mockPrisma.group.update.mockResolvedValue(mockUpdatedGroup)

			const result = await service.updateGroup(validInput)

			expect(mockPrisma.groupMember.findUnique).toHaveBeenCalledWith({
				where: {
					userId_groupId: {
						userId,
						groupId,
					},
				},
				select: {
					role: true,
				},
			})

			expect(mockPrisma.group.update).toHaveBeenCalledWith({
				where: { id: groupId },
				data: {
					name: 'Updated Group Name',
					description: 'Updated Description',
				},
				select: {
					id: true,
					name: true,
					description: true,
					inviteCode: true,
					isPersonal: true,
					createdAt: true,
					updatedAt: true,
					members: {
						select: {
							id: true,
							role: true,
							joinedAt: true,
							user: {
								select: {
									id: true,
									name: true,
									email: true,
									image: true,
								},
							},
						},
						orderBy: {
							joinedAt: 'asc',
						},
					},
					_count: {
						select: {
							shoppingListItems: true,
						},
					},
				},
			})

			expect(result).toEqual({
				...mockUpdatedGroup,
				myRole: 'ADMIN',
			})
		})

		test('should throw NOT_FOUND error when user is not a member', async () => {
			mockPrisma.groupMember.findUnique.mockResolvedValue(null)

			await expect(service.updateGroup(validInput)).rejects.toThrow(
				new TRPCError({
					code: 'NOT_FOUND',
					message: 'Group not found or you are not a member',
				}),
			)
		})

		test('should throw FORBIDDEN error when user is not admin', async () => {
			const mockMembership = {
				role: 'MEMBER',
			}

			mockPrisma.groupMember.findUnique.mockResolvedValue(mockMembership)

			await expect(service.updateGroup(validInput)).rejects.toThrow(
				new TRPCError({
					code: 'FORBIDDEN',
					message: 'Only group admins can update group details',
				}),
			)
		})

		test('should handle group not found during update', async () => {
			const mockMembership = {
				role: 'ADMIN',
			}

			const notFoundError = new Error('Record not found')
			;(notFoundError as any).code = 'P2025'

			mockPrisma.groupMember.findUnique.mockResolvedValue(mockMembership)
			mockPrisma.group.update.mockRejectedValue(notFoundError)

			await expect(service.updateGroup(validInput)).rejects.toThrow(
				new TRPCError({
					code: 'NOT_FOUND',
					message: 'Group not found',
				}),
			)
		})

		test('should handle partial updates', async () => {
			const partialInput: UpdateGroupInput = {
				id: groupId,
				name: 'Updated Name Only',
			}

			const mockMembership = {
				role: 'ADMIN',
			}

			const mockUpdatedGroup = {
				id: groupId,
				name: 'Updated Name Only',
				description: 'Original Description',
				inviteCode: 'invite-code',
				isPersonal: false,
				createdAt: new Date(),
				updatedAt: new Date(),
				members: [],
				_count: {
					shoppingListItems: 0,
				},
			}

			mockPrisma.groupMember.findUnique.mockResolvedValue(mockMembership)
			mockPrisma.group.update.mockResolvedValue(mockUpdatedGroup)

			await service.updateGroup(partialInput)

			expect(mockPrisma.group.update).toHaveBeenCalledWith({
				where: { id: groupId },
				data: {
					name: 'Updated Name Only',
				},
				select: {
					id: true,
					name: true,
					description: true,
					inviteCode: true,
					isPersonal: true,
					createdAt: true,
					updatedAt: true,
					members: {
						select: {
							id: true,
							role: true,
							joinedAt: true,
							user: {
								select: {
									id: true,
									name: true,
									email: true,
									image: true,
								},
							},
						},
						orderBy: {
							joinedAt: 'asc',
						},
					},
					_count: {
						select: {
							shoppingListItems: true,
						},
					},
				},
			})
		})
	})

	describe('deleteGroup', () => {
		const validInput: DeleteGroupInput = { id: groupId }

		test('should delete group successfully when user is admin', async () => {
			const mockMembership = {
				role: 'ADMIN',
				group: {
					isPersonal: false,
				},
			}

			mockPrisma.groupMember.findUnique.mockResolvedValue(mockMembership)
			mockPrisma.group.delete.mockResolvedValue({ id: groupId })

			const result = await service.deleteGroup(validInput)

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

			expect(mockPrisma.group.delete).toHaveBeenCalledWith({
				where: { id: groupId },
			})

			expect(result).toEqual({ success: true })
		})

		test('should throw NOT_FOUND error when user is not a member', async () => {
			mockPrisma.groupMember.findUnique.mockResolvedValue(null)

			await expect(service.deleteGroup(validInput)).rejects.toThrow(
				new TRPCError({
					code: 'NOT_FOUND',
					message: 'Group not found or you are not a member',
				}),
			)
		})

		test('should throw FORBIDDEN error when user is not admin', async () => {
			const mockMembership = {
				role: 'MEMBER',
				group: {
					isPersonal: false,
				},
			}

			mockPrisma.groupMember.findUnique.mockResolvedValue(mockMembership)

			await expect(service.deleteGroup(validInput)).rejects.toThrow(
				new TRPCError({
					code: 'FORBIDDEN',
					message: 'Only group admins can delete groups',
				}),
			)
		})

		test('should throw BAD_REQUEST error when trying to delete personal group', async () => {
			const mockMembership = {
				role: 'ADMIN',
				group: {
					isPersonal: true,
				},
			}

			mockPrisma.groupMember.findUnique.mockResolvedValue(mockMembership)

			await expect(service.deleteGroup(validInput)).rejects.toThrow(
				new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Personal groups cannot be deleted',
				}),
			)
		})

		test('should handle group not found during deletion', async () => {
			const mockMembership = {
				role: 'ADMIN',
				group: {
					isPersonal: false,
				},
			}

			const notFoundError = new Error('Record not found')
			;(notFoundError as any).code = 'P2025'

			mockPrisma.groupMember.findUnique.mockResolvedValue(mockMembership)
			mockPrisma.group.delete.mockRejectedValue(notFoundError)

			await expect(service.deleteGroup(validInput)).rejects.toThrow(
				new TRPCError({
					code: 'NOT_FOUND',
					message: 'Group not found',
				}),
			)
		})
	})

	describe('input validation scenarios', () => {
		test.each([
			{
				description: 'should handle special characters in group names',
				input: { name: 'Family & Friends 👨‍👩‍👧‍👦', description: 'Our group' },
			},
			{
				description: 'should handle maximum length group names',
				input: { name: 'A'.repeat(50), description: 'Test' },
			},
			{
				description: 'should handle maximum length descriptions',
				input: { name: 'Test Group', description: 'B'.repeat(200) },
			},
		])('$description', async ({ input }) => {
			const mockCreatedGroup = {
				id: groupId,
				...input,
				members: [],
				_count: { shoppingListItems: 0 },
			}
			mockPrisma.group.create.mockResolvedValue(mockCreatedGroup)

			await service.createGroup(input as CreateGroupInput)

			expect(mockPrisma.group.create).toHaveBeenCalledWith({
				data: {
					...input,
					members: {
						create: {
							userId,
							role: 'ADMIN',
						},
					},
				},
				select: {
					id: true,
					name: true,
					description: true,
					inviteCode: true,
					isPersonal: true,
					createdAt: true,
					updatedAt: true,
					members: {
						select: {
							id: true,
							role: true,
							joinedAt: true,
							user: {
								select: {
									id: true,
									name: true,
									email: true,
									image: true,
								},
							},
						},
					},
					_count: {
						select: {
							shoppingListItems: true,
						},
					},
				},
			})
		})
	})
})
