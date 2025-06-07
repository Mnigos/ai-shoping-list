import { TRPCError } from '@trpc/server'
import z from 'zod'
import type { ProtectedContext } from '~/lib/trpc/t'
import {
	ShoppingListActionSchema,
	ShoppingListActionsService,
} from './shopping-list-action.service'

export const ExecuteActionsInputSchema = z.object({
	actions: z.array(ShoppingListActionSchema),
	groupId: z.string(),
})
export type ExecuteActionsInput = z.infer<typeof ExecuteActionsInputSchema>

export const AddItemInputSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	amount: z.number().min(1, 'Amount must be at least 1').default(1),
	groupId: z.string(),
})
export type AddItemInput = z.infer<typeof AddItemInputSchema>

export const UpdateItemInputSchema = z.object({
	id: z.string(),
	amount: z.number().min(1, 'Amount must be at least 1'),
	groupId: z.string(),
})
export type UpdateItemInput = z.infer<typeof UpdateItemInputSchema>

export const ToggleCompleteInputSchema = z.object({
	id: z.string(),
	groupId: z.string(),
})
export type ToggleCompleteInput = z.infer<typeof ToggleCompleteInputSchema>

export const DeleteItemInputSchema = z.object({
	id: z.string(),
	groupId: z.string(),
})
export type DeleteItemInput = z.infer<typeof DeleteItemInputSchema>

export const GetItemsInputSchema = z.object({
	groupId: z.string(),
})
export type GetItemsInput = z.infer<typeof GetItemsInputSchema>

export class ShoppingListService {
	private readonly actionsService: ShoppingListActionsService

	constructor(private readonly ctx: ProtectedContext) {
		this.actionsService = new ShoppingListActionsService(ctx)
	}

	private async verifyGroupMembership(groupId: string) {
		const membership = await this.ctx.prisma.groupMember.findUnique({
			where: {
				userId_groupId: {
					userId: this.ctx.user.id,
					groupId: groupId,
				},
			},
		})

		if (!membership) {
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: 'You are not a member of this group',
			})
		}

		return membership
	}

	async getItems(input: GetItemsInput) {
		// Verify user is a member of the group
		await this.verifyGroupMembership(input.groupId)

		return this.ctx.prisma.shoppingListItem.findMany({
			where: { groupId: input.groupId },
			include: {
				createdBy: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		})
	}

	async executeActions(input: ExecuteActionsInput) {
		// Verify user is a member of the group
		await this.verifyGroupMembership(input.groupId)

		return this.actionsService.execute(input.actions, input.groupId)
	}

	async addItem(input: AddItemInput) {
		// Verify user is a member of the group
		await this.verifyGroupMembership(input.groupId)

		try {
			return await this.ctx.prisma.shoppingListItem.create({
				data: {
					name: input.name,
					amount: input.amount,
					groupId: input.groupId,
					createdById: this.ctx.user.id,
				},
				include: {
					createdBy: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			})
		} catch (error) {
			if (error instanceof Error && 'code' in error && error.code === 'P2002')
				throw new TRPCError({
					code: 'CONFLICT',
					message: `Item "${input.name}" already exists in this group's shopping list`,
				})

			throw error
		}
	}

	async updateItem(input: UpdateItemInput) {
		// Verify user is a member of the group
		await this.verifyGroupMembership(input.groupId)

		try {
			return await this.ctx.prisma.shoppingListItem.update({
				where: {
					id: input.id,
					groupId: input.groupId,
				},
				data: { amount: input.amount },
				include: {
					createdBy: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			})
		} catch (error) {
			if (error instanceof Error && 'code' in error && error.code === 'P2025')
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Item not found',
				})

			throw error
		}
	}

	async toggleComplete(input: ToggleCompleteInput) {
		// Verify user is a member of the group
		await this.verifyGroupMembership(input.groupId)

		const item = await this.ctx.prisma.shoppingListItem.findUnique({
			where: {
				id: input.id,
				groupId: input.groupId,
			},
		})

		if (!item)
			throw new TRPCError({ code: 'NOT_FOUND', message: 'Item not found' })

		return this.ctx.prisma.shoppingListItem.update({
			where: {
				id: input.id,
				groupId: input.groupId,
			},
			data: { isCompleted: !item.isCompleted },
			include: {
				createdBy: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		})
	}

	async deleteItem(input: DeleteItemInput) {
		// Verify user is a member of the group
		await this.verifyGroupMembership(input.groupId)

		try {
			return await this.ctx.prisma.shoppingListItem.delete({
				where: {
					id: input.id,
					groupId: input.groupId,
				},
			})
		} catch (error) {
			if (error instanceof Error && 'code' in error && error.code === 'P2025')
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Item not found',
				})

			throw error
		}
	}
}
