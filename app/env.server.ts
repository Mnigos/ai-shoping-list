import { z } from 'zod'

const envSchema = z.object({
	NODE_ENV: z
		.enum(['development', 'production', 'test'])
		.default('development'),
	DATABASE_URL: z.string().url(),
	DIRECT_URL: z.string().url().optional(),
	BETTER_AUTH_SECRET: z.string().min(32),
	BETTER_AUTH_URL: z.string().url(),
	VERCEL_URL: z.string().optional(),
})

function createEnv() {
	const parsed = envSchema.safeParse(process.env)

	if (!parsed.success) {
		console.error(
			'❌ Invalid environment variables:',
			parsed.error.flatten().fieldErrors,
		)
		throw new Error('Invalid environment variables')
	}

	return parsed.data
}

export const env = createEnv()

// Type for environment variables
export type Env = z.infer<typeof envSchema>
