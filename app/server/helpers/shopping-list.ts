import type { PrismaClient } from '@prisma/client'
import z from 'zod'

export type PrismaTransaction = Omit<
	PrismaClient,
	'$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

export const ShoppingListActionSchema = z.object({
	action: z.enum(['add', 'update', 'delete', 'complete']),
	name: z.string(),
	amount: z.number().min(1, 'Amount must be at least 1').optional(),
})

export async function handleAddAction(
	tx: PrismaTransaction,
	userId: string,
	action: z.infer<typeof ShoppingListActionSchema>,
) {
	if (!action.amount || action.amount < 1)
		throw new Error('Amount must be at least 1 for add action')

	const existingItem = await tx.shoppingListItem.findFirst({
		where: {
			userId,
			name: {
				equals: action.name,
				mode: 'insensitive',
			},
		},
	})

	if (existingItem)
		await tx.shoppingListItem.update({
			where: { id: existingItem.id },
			data: { amount: existingItem.amount + action.amount },
		})
	else
		await tx.shoppingListItem.create({
			data: {
				name: action.name,
				amount: action.amount,
				userId,
			},
		})
}

export async function handleUpdateAction(
	tx: PrismaTransaction,
	userId: string,
	action: z.infer<typeof ShoppingListActionSchema>,
) {
	if (!action.amount || action.amount < 1)
		throw new Error('Amount must be at least 1 for update action')

	const existingItem = await tx.shoppingListItem.findFirst({
		where: {
			userId,
			name: {
				equals: action.name,
				mode: 'insensitive',
			},
		},
	})

	if (!existingItem) throw new Error(`Item "${action.name}" not found`)

	await tx.shoppingListItem.update({
		where: { id: existingItem.id },
		data: { amount: action.amount },
	})
}

export async function handleDeleteAction(
	tx: PrismaTransaction,
	userId: string,
	action: z.infer<typeof ShoppingListActionSchema>,
) {
	const existingItem = await tx.shoppingListItem.findFirst({
		where: {
			userId,
			name: {
				equals: action.name,
				mode: 'insensitive',
			},
		},
	})

	if (!existingItem) throw new Error(`Item "${action.name}" not found`)

	await tx.shoppingListItem.delete({
		where: { id: existingItem.id },
	})
}

export async function handleCompleteAction(
	tx: PrismaTransaction,
	userId: string,
	action: z.infer<typeof ShoppingListActionSchema>,
) {
	const existingItem = await tx.shoppingListItem.findFirst({
		where: {
			userId,
			name: {
				equals: action.name,
				mode: 'insensitive',
			},
		},
	})

	if (!existingItem) throw new Error(`Item "${action.name}" not found`)

	await tx.shoppingListItem.update({
		where: { id: existingItem.id },
		data: { isCompleted: !existingItem.isCompleted },
	})
}
