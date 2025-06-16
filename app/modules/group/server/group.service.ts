import type { ProtectedContext } from '~/lib/trpc/t'
import { GroupError } from './errors'
import { GroupInviteService } from './group-invite.service'
import type {
	CreateGroupInput,
	CreateGroupOutput,
	DeleteGroupInput,
	DeleteGroupOutput,
	GetGroupInput,
	GetGroupOutput,
	MyGroupDetailsOutput,
	MyGroupsOutput,
	MyGroupsOverviewOutput,
	RegenerateInviteCodeInput,
	RegenerateInviteCodeOutput,
	UpdateGroupInput,
	UpdateGroupOutput,
} from './schemas'

export class GroupService {
	private readonly inviteService: GroupInviteService

	constructor(private readonly ctx: ProtectedContext) {
		this.inviteService = new GroupInviteService(this.ctx)
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

			if (!myRole) throw new GroupError('NOT_GROUP_MEMBER')

			return {
				...group,
				membersCount: members.length,
				myRole,
			}
		})
	}

	async getGroup({ id }: GetGroupInput): Promise<GetGroupOutput> {
		const foundGroup = await this.ctx.prisma.group.findUnique({
			where: { id, members: { some: { userId: this.ctx.user.id } } },
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
			throw new GroupError('GROUP_NOT_FOUND_OR_NOT_MEMBER')

		return {
			...foundGroup,
			membersCount: foundGroup.members.length,
			myRole,
		}
	}

	async getGroupDetails({ id }: GetGroupInput): Promise<MyGroupDetailsOutput> {
		const foundGroup = await this.ctx.prisma.group.findUnique({
			where: { id, members: { some: { userId: this.ctx.user.id } } },
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
			throw new GroupError('GROUP_NOT_FOUND_OR_NOT_MEMBER')

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

	async createGroup({
		name,
		description,
	}: CreateGroupInput): Promise<CreateGroupOutput> {
		try {
			const createdGroup = await this.ctx.prisma.group.create({
				data: {
					name,
					description,
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

			if (!myRole) throw new GroupError('GROUP_CREATION_FAILED')

			return {
				...createdGroup,
				membersCount: createdGroup.members.length,
				myRole,
			}
		} catch (error) {
			if (error instanceof Error && 'code' in error && error.code === 'P2002')
				throw new GroupError('INVITE_CODE_CONFLICT')

			throw error
		}
	}

	async updateGroup({
		id,
		name,
		description,
	}: UpdateGroupInput): Promise<UpdateGroupOutput> {
		const membership = await this.ctx.prisma.groupMember.findUnique({
			where: {
				userId_groupId: {
					userId: this.ctx.user.id,
					groupId: id,
				},
			},
			select: {
				role: true,
			},
		})

		if (!membership) throw new GroupError('GROUP_NOT_FOUND_OR_NOT_MEMBER')

		if (membership.role !== 'ADMIN')
			throw new GroupError('ADMIN_ONLY_UPDATE_GROUP')

		try {
			const updatedGroup = await this.ctx.prisma.group.update({
				where: { id },
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
				throw new GroupError('GROUP_NOT_FOUND')

			throw error
		}
	}

	async deleteGroup({ id }: DeleteGroupInput): Promise<DeleteGroupOutput> {
		const membership = await this.ctx.prisma.groupMember.findUnique({
			where: {
				userId_groupId: {
					userId: this.ctx.user.id,
					groupId: id,
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

		if (!membership) throw new GroupError('GROUP_NOT_FOUND_OR_NOT_MEMBER')

		if (membership.role !== 'ADMIN')
			throw new GroupError('ADMIN_ONLY_DELETE_GROUP')

		if (membership.group.isPersonal)
			throw new GroupError('PERSONAL_GROUP_CANNOT_DELETE')

		try {
			await this.ctx.prisma.group.delete({
				where: {
					id,
					members: { some: { userId: this.ctx.user.id, role: 'ADMIN' } },
					isPersonal: false,
				},
			})

			return { success: true }
		} catch (error) {
			if (error instanceof Error && 'code' in error && error.code === 'P2025')
				throw new GroupError('GROUP_NOT_FOUND')

			throw error
		}
	}

	async regenerateInviteCode({
		id,
	}: RegenerateInviteCodeInput): Promise<RegenerateInviteCodeOutput> {
		const membership = await this.ctx.prisma.groupMember.findUnique({
			where: {
				userId_groupId: {
					userId: this.ctx.user.id,
					groupId: id,
				},
			},
			select: {
				role: true,
			},
		})

		if (!membership) throw new GroupError('GROUP_NOT_FOUND_OR_NOT_MEMBER')

		if (membership.role !== 'ADMIN')
			throw new GroupError('ADMIN_ONLY_REGENERATE_INVITE')

		const inviteCode = this.inviteService.generateInviteCode()

		try {
			await this.ctx.prisma.group.update({
				where: { id },
				data: { inviteCode },
			})

			return { inviteCode }
		} catch (error) {
			if (error instanceof Error && 'code' in error && error.code === 'P2025')
				throw new GroupError('GROUP_NOT_FOUND')

			throw error
		}
	}
}
