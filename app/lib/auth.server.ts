import { type User, betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { type UserWithAnonymous, anonymous } from 'better-auth/plugins'
import { env } from '~/env.server'
import { prisma } from '~/lib/prisma'
import { ensurePersonalGroup } from '~/modules/group/server/helpers/personal-group'

export const auth = betterAuth({
	baseUrl: env.VERCEL_URL ?? env.BETTER_AUTH_URL,
	database: prismaAdapter(prisma, {
		provider: 'postgresql',
	}),
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
		},
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
		// Ensure the new user has a personal group
		const personalGroup = await ensurePersonalGroup(tx, newUser.user.id)

		// Find anonymous user's shopping list items
		// Note: This assumes we're still in transition period where items might have userId
		const anonymousItems = await tx.shoppingListItem.findMany({
			where: {
				OR: [
					{ createdById: anonymousUser.user.id },
					// Fallback for old schema if userId field still exists
				],
			},
		})

		for (const item of anonymousItems) {
			const existingItem = await tx.shoppingListItem.findFirst({
				where: {
					groupId: personalGroup.id,
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
					data: {
						groupId: personalGroup.id,
						createdById: newUser.user.id,
					},
				})
			}
		}
	})
}
