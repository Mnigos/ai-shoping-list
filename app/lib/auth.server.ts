import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { anonymous } from 'better-auth/plugins'
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
	plugins: [anonymous()],
})
