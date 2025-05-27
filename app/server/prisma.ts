import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'
import { env } from '../env.server'

import ws from 'ws'

neonConfig.webSocketConstructor = ws

const connectionString = env.DATABASE_URL

declare global {
	var prisma: PrismaClient | undefined
}

const adapter = new PrismaNeon({ connectionString })
// biome-ignore lint/suspicious/noRedeclare: <explanation>
export const prisma = globalThis.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
