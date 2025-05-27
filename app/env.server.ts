import { z } from 'zod'

const envSchema = z.object({
	NODE_ENV: z
		.enum(['development', 'production', 'test'])
		.default('development'),
	DATABASE_URL: z.string().url(),
	DIRECT_URL: z.string().url().optional(),
	GEMINI_API_KEY: z.string(),
	VERCEL_URL: z.string().optional(),
})

function createEnv() {
	const parsed = envSchema.safeParse(process.env)

	if (!parsed.success) {
		console.error(
			'❌ Invalid environment variables:',
			parsed.error.flatten().fieldErrors,
		)
		throw new Error(
			`❌ Invalid environment variables: ${JSON.stringify(
				parsed.error.flatten().fieldErrors,
			)}`,
		)
	}

	return parsed.data
}

export const env = createEnv()

// Type for environment variables
export type Env = z.infer<typeof envSchema>
