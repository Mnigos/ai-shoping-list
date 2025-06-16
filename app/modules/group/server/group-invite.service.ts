import { customAlphabet } from 'nanoid'
import type { ProtectedContext } from '~/lib/trpc/t'
import { GroupError } from './errors'
import type {
	JoinGroupInput,
	JoinGroupOutput,
	ValidateInviteCodeInput,
	ValidateInviteCodeOutput,
} from './schemas'

// Implement verifying before joining and show user group preview
export class GroupInviteService {
	constructor(private readonly ctx: ProtectedContext) {}

	/*
	 * !!! This needs to be refactored
	 * Should be saved to KV storage
	 * Should be able to expire
	 */
	generateInviteCode() {
		const generateToken = customAlphabet(
			'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
			6,
		)

		return generateToken()
	}

	async joinGroup({ inviteCode }: JoinGroupInput): Promise<JoinGroupOutput> {
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
			throw new GroupError('ANONYMOUS_USER_CANNOT_JOIN')

		const foundGroup = await this.ctx.prisma.group.findUnique({
			where: { inviteCode },
			select: {
				id: true,
				members: {
					select: {
						userId: true,
					},
				},
			},
		})

		if (!foundGroup) throw new GroupError('GROUP_NOT_FOUND')

		if (foundGroup.members.some(m => m.userId === this.ctx.user.id))
			throw new GroupError('ALREADY_MEMBER')

		try {
			const updatedGroup = await this.ctx.prisma.group.update({
				where: {
					inviteCode,
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
				throw new GroupError('GROUP_NOT_FOUND')

			throw error
		}
	}

	async validateInviteCode({
		inviteCode,
	}: ValidateInviteCodeInput): Promise<ValidateInviteCodeOutput> {
		const foundGroup = await this.ctx.prisma.group.findUnique({
			where: { inviteCode },
			select: {
				id: true,
				name: true,
				description: true,
				isPersonal: true,
				members: {
					select: {
						userId: true,
						role: true,
					},
				},
				createdAt: true,
			},
		})

		if (!foundGroup) throw new GroupError('GROUP_NOT_FOUND')

		return {
			group: {
				id: foundGroup.id,
				name: foundGroup.name,
				createdAt: foundGroup.createdAt,
				isPersonal: foundGroup.isPersonal,
				description: foundGroup.description,
				membersCount: foundGroup.members.length,
				isMember: foundGroup.members.some(m => m.userId === this.ctx.user.id),
			},
		}
	}
}
