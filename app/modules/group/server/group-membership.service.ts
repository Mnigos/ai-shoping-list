import type { ProtectedContext } from '~/lib/trpc/t'
import { GroupError } from './errors'
import type {
	LeaveGroupInput,
	LeaveGroupOutput,
	RemoveMemberInput,
	RemoveMemberOutput,
	UpdateRoleInput,
	UpdateRoleOutput,
} from './schemas'

export class GroupMembershipService {
	constructor(private readonly ctx: ProtectedContext) {}

	async removeMember({
		groupId,
		memberId,
	}: RemoveMemberInput): Promise<RemoveMemberOutput> {
		const membership = await this.ctx.prisma.groupMember.findUnique({
			where: {
				userId_groupId: {
					userId: this.ctx.user.id,
					groupId,
				},
			},
			select: {
				role: true,
			},
		})

		if (!membership) throw new GroupError('GROUP_NOT_FOUND_OR_NOT_MEMBER')

		if (membership.role !== 'ADMIN')
			throw new GroupError('ADMIN_ONLY_REMOVE_MEMBERS')

		try {
			await this.ctx.prisma.groupMember.delete({
				where: {
					userId_groupId: {
						userId: memberId,
						groupId,
					},
				},
			})

			return { success: true }
		} catch (error) {
			if (error instanceof Error && 'code' in error && error.code === 'P2025')
				throw new GroupError('MEMBER_NOT_FOUND')

			throw error
		}
	}

	async updateMemberRole({
		groupId,
		memberId,
		role,
	}: UpdateRoleInput): Promise<UpdateRoleOutput> {
		const membership = await this.ctx.prisma.groupMember.findUnique({
			where: {
				userId_groupId: {
					userId: this.ctx.user.id,
					groupId,
				},
			},
			select: {
				role: true,
			},
		})

		if (!membership) throw new GroupError('GROUP_NOT_FOUND_OR_NOT_MEMBER')

		if (membership.role !== 'ADMIN')
			throw new GroupError('ADMIN_ONLY_UPDATE_ROLES')

		try {
			await this.ctx.prisma.groupMember.update({
				where: {
					userId_groupId: {
						userId: memberId,
						groupId,
					},
				},
				data: {
					role,
				},
			})

			return { success: true }
		} catch (error) {
			if (error instanceof Error && 'code' in error && error.code === 'P2025')
				throw new GroupError('MEMBER_NOT_FOUND')

			throw error
		}
	}

	async leaveGroup({ id }: LeaveGroupInput): Promise<LeaveGroupOutput> {
		const foundGroup = await this.ctx.prisma.group.findUnique({
			where: { id, members: { some: { userId: this.ctx.user.id } } },
			select: {
				id: true,
				isPersonal: true,
			},
		})

		if (!foundGroup) throw new GroupError('GROUP_NOT_FOUND_OR_NOT_MEMBER')

		if (foundGroup.isPersonal)
			throw new GroupError('PERSONAL_GROUP_CANNOT_LEAVE')

		try {
			await this.ctx.prisma.groupMember.delete({
				where: {
					userId_groupId: { userId: this.ctx.user.id, groupId: id },
				},
			})

			return { success: true }
		} catch (error) {
			if (error instanceof Error && 'code' in error && error.code === 'P2025')
				throw new GroupError('GROUP_NOT_FOUND')

			throw error
		}
	}
}
