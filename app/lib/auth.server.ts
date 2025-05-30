import { type User, betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { type UserWithAnonymous, anonymous } from 'better-auth/plugins'
import { env } from '~/env.server'
import { prisma } from '~/lib/prisma'

export const auth = betterAuth({
	baseUrl: env.VERCEL_URL ?? env.BETTER_AUTH_URL,
	database: prismaAdapter(prisma, {
		provider: 'postgresql',
	}),
	emailAndPassword: {
		enabled: true,
	},
	session: {
		expiresIn: 604800, // 7 days
		updateAge: 86400, // 1 day
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60, // 5 minutes
		},
	},
	plugins: [
		anonymous({
			onLinkAccount: linkAnonymousAccount,
		}),
	],
})

interface LinkAccountParams {
	anonymousUser: { user: Pick<UserWithAnonymous, 'id'> }
	newUser: { user: Pick<User, 'id'> }
}

export async function linkAnonymousAccount({
	anonymousUser,
	newUser,
}: LinkAccountParams) {
	await prisma.$transaction(async tx => {
		const anonymousItems = await tx.shoppingListItem.findMany({
			where: { userId: anonymousUser.user.id },
		})

		for (const item of anonymousItems) {
			const existingItem = await tx.shoppingListItem.findFirst({
				where: {
					userId: newUser.user.id,
					name: {
						equals: item.name,
						mode: 'insensitive',
					},
				},
			})

			if (existingItem) {
				await tx.shoppingListItem.update({
					where: { id: existingItem.id },
					data: {
						amount: existingItem.amount + item.amount,
						isCompleted: existingItem.isCompleted || item.isCompleted,
					},
				})

				await tx.shoppingListItem.delete({
					where: { id: item.id },
				})
			} else {
				await tx.shoppingListItem.update({
					where: { id: item.id },
					data: { userId: newUser.user.id },
				})
			}
		}
	})
}
