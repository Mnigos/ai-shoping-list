import type { PrismaTransaction } from '~/shared/types/prisma'

export async function ensurePersonalGroup(
	tx: PrismaTransaction,
	userId: string,
) {
	const existingUser = await tx.user.findUnique({
		where: { id: userId },
		select: { personalGroup: true },
	})

	if (existingUser?.personalGroup) return existingUser.personalGroup

	const user = await tx.user.findUnique({
		where: { id: userId },
		select: { id: true, name: true },
	})

	if (!user) throw new Error('User not found')

	const personalGroup = await tx.group.create({
		data: {
			name: `${user.name}'s Personal List`,
			description: 'Your personal shopping list',
			isPersonal: true,
		},
		select: { id: true, name: true },
	})

	await tx.groupMember.create({
		data: {
			userId: user.id,
			groupId: personalGroup.id,
			role: 'ADMIN',
		},
	})

	await tx.user.update({
		where: { id: user.id },
		data: { personalGroupId: personalGroup.id },
	})

	return personalGroup
}
