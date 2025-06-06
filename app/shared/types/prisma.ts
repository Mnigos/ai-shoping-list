import type { PrismaClient } from '@prisma/client'

export type PrismaTransaction = Omit<
	PrismaClient,
	'$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>
