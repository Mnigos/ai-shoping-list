import { TRPCError } from '@trpc/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProtectedContext } from '~/lib/trpc/t'
import { GroupMemberService } from './group-member.service'

const mockPrisma = {
	groupMember: {
		findUnique: vi.fn(),
		findMany: vi.fn(),
		delete: vi.fn(),
		update: vi.fn(),
		count: vi.fn(),
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

describe('GroupMemberService', () => {
	let service: GroupMemberService

	beforeEach(() => {
		vi.clearAllMocks()
		service = new GroupMemberService(mockContext)
	})

	describe('getMembers', () => {
		it('should return group members when user is a member', async () => {
			const groupId = 'group-1'
			const mockMembers = [
				{
					id: 'member-1',
					role: 'ADMIN' as const,
					joinedAt: new Date(),
					user: {
						id: 'user-1',
						name: 'John Doe',
						email: 'john@example.com',
						image: null,
					},
				},
			]

			mockPrisma.groupMember.findUnique.mockResolvedValueOnce({
				role: 'ADMIN',
				group: { id: groupId, isPersonal: false },
			})
			mockPrisma.groupMember.findMany.mockResolvedValueOnce(mockMembers)

			const result = await service.getMembers({ groupId })

			expect(result).toEqual(mockMembers)
		})

		it('should throw error when user is not a member', async () => {
			const groupId = 'group-1'
			mockPrisma.groupMember.findUnique.mockResolvedValueOnce(null)

			await expect(service.getMembers({ groupId })).rejects.toThrow(
				new TRPCError({
					code: 'FORBIDDEN',
					message: 'You are not a member of this group',
				}),
			)
		})
	})

	describe('removeMember', () => {
		it('should remove member when user is admin', async () => {
			const groupId = 'group-1'
			const memberId = 'member-1'
			const mockMemberToRemove = {
				id: memberId,
				role: 'MEMBER' as const,
				user: { id: 'user-2', name: 'Jane Smith' },
			}

			mockPrisma.groupMember.findUnique
				.mockResolvedValueOnce({
					role: 'ADMIN',
					group: { id: groupId, isPersonal: false },
				})
				.mockResolvedValueOnce(mockMemberToRemove)

			mockPrisma.groupMember.delete.mockResolvedValueOnce({} as any)

			const result = await service.removeMember({ groupId, memberId })

			expect(result.success).toBe(true)
			expect(result.removedMember).toEqual(mockMemberToRemove)
		})

		it('should throw error when user is not admin', async () => {
			const groupId = 'group-1'
			const memberId = 'member-1'

			mockPrisma.groupMember.findUnique.mockResolvedValueOnce({
				role: 'MEMBER',
				group: { id: groupId, isPersonal: false },
			})

			await expect(service.removeMember({ groupId, memberId })).rejects.toThrow(
				new TRPCError({
					code: 'FORBIDDEN',
					message: 'Only group admins can perform this action',
				}),
			)
		})
	})

	describe('updateRole', () => {
		it('should update member role when user is admin', async () => {
			const groupId = 'group-1'
			const memberId = 'member-1'
			const newRole = 'ADMIN' as const
			const mockUpdatedMember = {
				id: memberId,
				role: newRole,
				joinedAt: new Date(),
				user: {
					id: 'user-2',
					name: 'Jane Smith',
					email: 'jane@example.com',
					image: null,
				},
			}

			mockPrisma.groupMember.findUnique
				.mockResolvedValueOnce({
					role: 'ADMIN',
					group: { id: groupId, isPersonal: false },
				})
				.mockResolvedValueOnce({
					id: memberId,
					role: 'MEMBER',
					user: { id: 'user-2', name: 'Jane Smith' },
				})

			mockPrisma.groupMember.update.mockResolvedValueOnce(mockUpdatedMember)

			const result = await service.updateRole({
				groupId,
				memberId,
				role: newRole,
			})

			expect(result).toEqual(mockUpdatedMember)
		})
	})

	describe('leaveGroup', () => {
		it('should allow member to leave group', async () => {
			const groupId = 'group-1'

			mockPrisma.groupMember.findUnique.mockResolvedValueOnce({
				role: 'MEMBER',
				group: { id: groupId, isPersonal: false },
			})

			mockPrisma.groupMember.delete.mockResolvedValueOnce({} as any)

			const result = await service.leaveGroup({ groupId })

			expect(result.success).toBe(true)
			expect(result.leftGroupId).toBe(groupId)
		})

		it('should throw error when trying to leave personal group', async () => {
			const groupId = 'group-1'

			mockPrisma.groupMember.findUnique.mockResolvedValueOnce({
				role: 'MEMBER',
				group: { id: groupId, isPersonal: true },
			})

			await expect(service.leaveGroup({ groupId })).rejects.toThrow(
				new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Cannot leave your personal group',
				}),
			)
		})
	})
})
