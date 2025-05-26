import { z } from 'zod'

const clientEnvSchema = z.object({
	MODE: z.enum(['development', 'production', 'test']).default('development'),
	DEV: z.boolean().default(false),
	PROD: z.boolean().default(true),
})

function createClientEnv() {
	const parsed = clientEnvSchema.safeParse(import.meta.env)

	if (!parsed.success) {
		console.error(
			'❌ Invalid client environment variables:',
			parsed.error.flatten().fieldErrors,
		)
		throw new Error('Invalid client environment variables')
	}

	return parsed.data
}

export const clientEnv = createClientEnv()

export type ClientEnv = z.infer<typeof clientEnvSchema>
