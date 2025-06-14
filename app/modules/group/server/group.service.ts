import { TRPCError } from '@trpc/server'
import type { ProtectedContext } from '~/lib/trpc/t'
import { GroupInviteService } from './group-invite.service'
import {
	GroupMemberService,
	type UpdateRoleInput,
} from './group-member.service'
import type {
	CreateGroupInput,
	CreateGroupOutput,
	DeleteGroupInput,
	DeleteGroupOutput,
	GetGroupInput,
	GetGroupOutput,
	JoinGroupInput,
	JoinGroupOutput,
	LeaveGroupInput,
	LeaveGroupOutput,
	MyGroupDetailsOutput,
	MyGroupsOutput,
	MyGroupsOverviewOutput,
	RegenerateInviteCodeInput,
	RegenerateInviteCodeOutput,
	RemoveMemberInput,
	RemoveMemberOutput,
	UpdateGroupInput,
	UpdateGroupOutput,
	UpdateRoleOutput,
} from './schemas'

export class GroupService {
	private readonly inviteService: GroupInviteService
	private readonly memberService: GroupMemberService

	constructor(private readonly ctx: ProtectedContext) {
		this.inviteService = new GroupInviteService(this.ctx)
		this.memberService = new GroupMemberService(this.ctx)
	}

	async getMyGroups(): Promise<MyGroupsOutput> {
		return await this.ctx.prisma.group.findMany({
			where: {
				members: {
					some: {
						userId: this.ctx.user.id,
					},
				},
			},
			select: {
				id: true,
				name: true,
				isPersonal: true,
			},
			orderBy: { createdAt: 'desc' },
		})
	}

	async getMyGroupsOverview(): Promise<MyGroupsOverviewOutput> {
		const foundGroups = await this.ctx.prisma.group.findMany({
			where: {
				members: {
					some: { userId: this.ctx.user.id },
				},
			},
			select: {
				id: true,
				name: true,
				description: true,
				isPersonal: true,
				members: {
					select: {
						role: true,
						user: {
							select: {
								id: true,
							},
						},
					},
				},
			},
		})

		return foundGroups.map(({ members, ...group }) => {
			const myRole = members.find(m => m.user.id === this.ctx.user.id)?.role

			if (!myRole)
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You are not a member of this group',
				})

			return {
				...group,
				membersCount: members.length,
				myRole,
			}
		})
	}

	async getGroup(input: GetGroupInput): Promise<GetGroupOutput> {
		const foundGroup = await this.ctx.prisma.group.findUnique({
			where: { id: input.id, members: { some: { userId: this.ctx.user.id } } },
			select: {
				id: true,
				name: true,
				description: true,
				isPersonal: true,
				members: {
					select: {
						role: true,
						user: {
							select: {
								id: true,
							},
						},
					},
				},
			},
		})

		const myRole = foundGroup?.members.find(
			m => m.user.id === this.ctx.user.id,
		)?.role

		if (!foundGroup || !myRole)
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Group not found or you are not a member',
			})

		return {
			...foundGroup,
			membersCount: foundGroup.members.length,
			myRole,
		}
	}

	async getGroupDetails(input: GetGroupInput): Promise<MyGroupDetailsOutput> {
		const foundGroup = await this.ctx.prisma.group.findUnique({
			where: { id: input.id, members: { some: { userId: this.ctx.user.id } } },
			select: {
				id: true,
				name: true,
				description: true,
				isPersonal: true,
				inviteCode: true,
				createdAt: true,
				members: {
					select: {
						role: true,
						joinedAt: true,
						user: {
							select: {
								id: true,
								name: true,
								image: true,
							},
						},
					},
				},
			},
		})

		const myRole = foundGroup?.members.find(
			m => m.user.id === this.ctx.user.id,
		)?.role

		if (!foundGroup || !myRole)
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Group not found or you are not a member',
			})

		console.log('members', foundGroup.members)

		return {
			...foundGroup,
			inviteCode: myRole === 'ADMIN' ? foundGroup.inviteCode! : undefined,
			membersCount: foundGroup.members.length,
			myRole,
			members: foundGroup.members.map(m => ({
				role: m.role,
				name: m.user.name,
				joinedAt: m.joinedAt,
				userId: m.user.id,
				image: m.user.image ?? undefined,
			})),
		}
	}

	async createGroup(input: CreateGroupInput): Promise<CreateGroupOutput> {
		try {
			const createdGroup = await this.ctx.prisma.group.create({
				data: {
					name: input.name,
					description: input.description,
					members: {
						create: {
							userId: this.ctx.user.id,
							role: 'ADMIN',
						},
					},
					inviteCode: this.inviteService.generateInviteCode(),
				},
				select: {
					id: true,
					name: true,
					description: true,
					isPersonal: true,
					members: {
						select: {
							role: true,
							user: {
								select: {
									id: true,
								},
							},
						},
					},
				},
			})

			const myRole = createdGroup.members.find(
				m => m.user.id === this.ctx.user.id,
			)?.role

			if (!myRole)
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to create group',
				})

			return {
				...createdGroup,
				membersCount: createdGroup.members.length,
				myRole,
			}
		} catch (error) {
			if (error instanceof Error && 'code' in error && error.code === 'P2002')
				throw new TRPCError({
					code: 'CONFLICT',
					message:
						'A group with this invite code already exists. Please try again.',
				})

			throw error
		}
	}

	async updateGroup(input: UpdateGroupInput): Promise<UpdateGroupOutput> {
		const membership = await this.ctx.prisma.groupMember.findUnique({
			where: {
				userId_groupId: {
					userId: this.ctx.user.id,
					groupId: input.id,
				},
			},
			select: {
				role: true,
			},
		})

		if (!membership)
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Group not found or you are not a member',
			})

		if (membership.role !== 'ADMIN')
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: 'Only group admins can update group details',
			})

		try {
			const { name, description } = input

			const updatedGroup = await this.ctx.prisma.group.update({
				where: { id: input.id },
				data: {
					name,
					description,
				},
				select: {
					id: true,
					name: true,
					description: true,
					isPersonal: true,
					members: {
						select: {
							role: true,
							user: {
								select: {
									id: true,
								},
							},
						},
					},
				},
			})

			return {
				...updatedGroup,
				membersCount: updatedGroup.members.length,
				myRole: membership.role,
			}
		} catch (error) {
			if (error instanceof Error && 'code' in error && error.code === 'P2025')
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Group not found',
				})

			throw error
		}
	}

	async deleteGroup(input: DeleteGroupInput): Promise<DeleteGroupOutput> {
		const membership = await this.ctx.prisma.groupMember.findUnique({
			where: {
				userId_groupId: {
					userId: this.ctx.user.id,
					groupId: input.id,
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

		if (!membership)
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Group not found or you are not a member',
			})

		if (membership.role !== 'ADMIN')
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: 'Only group admins can delete groups',
			})

		if (membership.group.isPersonal)
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: 'Personal groups cannot be deleted',
			})

		try {
			await this.ctx.prisma.group.delete({
				where: {
					id: input.id,
					members: { some: { userId: this.ctx.user.id, role: 'ADMIN' } },
					isPersonal: false,
				},
			})

			return { success: true }
		} catch (error) {
			if (error instanceof Error && 'code' in error && error.code === 'P2025')
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Group not found',
				})

			throw error
		}
	}

	async regenerateInviteCode(
		input: RegenerateInviteCodeInput,
	): Promise<RegenerateInviteCodeOutput> {
		const membership = await this.ctx.prisma.groupMember.findUnique({
			where: {
				userId_groupId: {
					userId: this.ctx.user.id,
					groupId: input.id,
				},
			},
			select: {
				role: true,
			},
		})

		if (!membership)
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Group not found or you are not a member',
			})

		if (membership.role !== 'ADMIN')
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: 'Only group admins can regenerate invite codes',
			})

		const inviteCode = this.inviteService.generateInviteCode()

		try {
			await this.ctx.prisma.group.update({
				where: { id: input.id },
				data: { inviteCode },
			})

			return { inviteCode }
		} catch (error) {
			if (error instanceof Error && 'code' in error && error.code === 'P2025')
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Group not found',
				})

			throw error
		}
	}

	async joinGroup(input: JoinGroupInput): Promise<JoinGroupOutput> {
		const foundUser = await this.ctx.prisma.user.findUnique({
			where: {
				id: this.ctx.user.id,
			},
			select: {
				id: true,
				isAnonymous: true,
			},
		})

		if (foundUser?.isAnonymous)
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: 'You must be signed in to join a group',
			})

		const foundGroup = await this.ctx.prisma.group.findUnique({
			where: { inviteCode: input.inviteCode },
			select: {
				id: true,
				members: {
					select: {
						userId: true,
					},
				},
			},
		})

		if (!foundGroup)
			throw new TRPCError({ code: 'NOT_FOUND', message: 'Group not found' })

		if (foundGroup.members.some(m => m.userId === this.ctx.user.id))
			throw new TRPCError({
				code: 'CONFLICT',
				message: 'You are already a member of this group',
			})

		try {
			const updatedGroup = await this.ctx.prisma.group.update({
				where: {
					inviteCode: input.inviteCode,
				},
				data: {
					members: { create: { userId: this.ctx.user.id, role: 'MEMBER' } },
				},
				select: {
					id: true,
				},
			})

			return { groupId: updatedGroup.id }
		} catch (error) {
			if (error instanceof Error && 'code' in error && error.code === 'P2025')
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Group not found' })

			throw error
		}
	}

	async removeMember(input: RemoveMemberInput): Promise<RemoveMemberOutput> {
		const membership = await this.ctx.prisma.groupMember.findUnique({
			where: {
				userId_groupId: {
					userId: this.ctx.user.id,
					groupId: input.groupId,
				},
			},
			select: {
				role: true,
			},
		})

		if (!membership)
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Group not found or you are not a member',
			})

		if (membership.role !== 'ADMIN')
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: 'Only group admins can remove members',
			})

		try {
			await this.ctx.prisma.groupMember.delete({
				where: {
					userId_groupId: {
						userId: input.memberId,
						groupId: input.groupId,
					},
				},
			})

			return { success: true }
		} catch (error) {
			if (error instanceof Error && 'code' in error && error.code === 'P2025')
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Member not found' })

			throw error
		}
	}

	async updateRole(input: UpdateRoleInput): Promise<UpdateRoleOutput> {
		const membership = await this.ctx.prisma.groupMember.findUnique({
			where: {
				userId_groupId: {
					userId: this.ctx.user.id,
					groupId: input.groupId,
				},
			},
			select: {
				role: true,
			},
		})

		if (!membership)
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Group not found or you are not a member',
			})

		if (membership.role !== 'ADMIN')
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: 'Only group admins can update member roles',
			})

		try {
			await this.ctx.prisma.groupMember.update({
				where: {
					userId_groupId: {
						userId: input.memberId,
						groupId: input.groupId,
					},
				},
				data: {
					role: input.role,
				},
			})

			return { success: true }
		} catch (error) {
			if (error instanceof Error && 'code' in error && error.code === 'P2025')
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Member not found' })

			throw error
		}
	}

	async leaveGroup(input: LeaveGroupInput): Promise<LeaveGroupOutput> {
		const foundGroup = await this.ctx.prisma.group.findUnique({
			where: { id: input.id, members: { some: { userId: this.ctx.user.id } } },
			select: {
				id: true,
				isPersonal: true,
			},
		})

		if (!foundGroup)
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Group not found or you are not a member',
			})

		if (foundGroup.isPersonal)
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: 'Cannot leave personal group',
			})

		try {
			await this.ctx.prisma.groupMember.delete({
				where: {
					userId_groupId: { userId: this.ctx.user.id, groupId: input.id },
				},
			})

			return { success: true }
		} catch (error) {
			if (error instanceof Error && 'code' in error && error.code === 'P2025')
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Group not found' })

			throw error
		}
	}
}
