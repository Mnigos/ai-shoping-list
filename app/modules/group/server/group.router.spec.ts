import { vi } from 'vitest'
import { groupRouter } from './group.router'
import {
	CreateGroupInputSchema,
	DeleteGroupInputSchema,
	GetGroupDetailsInputSchema,
	UpdateGroupInputSchema,
} from './group.service'

vi.mock('./group.procedure', () => ({
	groupProcedure: {
		query: vi.fn().mockReturnThis(),
		input: vi.fn().mockReturnThis(),
		mutation: vi.fn().mockReturnThis(),
	},
}))

describe('GroupRouter', () => {
	describe('structure', () => {
		test('should have all required routes', () => {
			const expectedRoutes = [
				'getMyGroups',
				'getGroupDetails',
				'createGroup',
				'updateGroup',
				'deleteGroup',
			]

			for (const route of expectedRoutes) {
				expect(groupRouter).toHaveProperty(route)
			}
		})

		test('should define routes as TRPCRouterRecord', () => {
			expect(groupRouter).toBeDefined()
			expect(typeof groupRouter).toBe('object')
		})
	})

	describe('input schemas', () => {
		describe('CreateGroupInputSchema', () => {
			test('should validate correct create group input', () => {
				const validInput = {
					name: 'Family Group',
					description: 'Our family shopping list',
				}

				const result = CreateGroupInputSchema.safeParse(validInput)
				expect(result.success).toBe(true)
			})

			test('should validate create group input without description', () => {
				const validInput = {
					name: 'Family Group',
				}

				const result = CreateGroupInputSchema.safeParse(validInput)
				expect(result.success).toBe(true)
			})

			test('should require name', () => {
				const invalidInputs = [
					{}, // missing name
					{ description: 'Only description' }, // missing name
					{ name: '' }, // empty name
				]

				for (const input of invalidInputs) {
					const result = CreateGroupInputSchema.safeParse(input)
					expect(result.success).toBe(false)
				}
			})

			test('should validate name length limits', () => {
				// Valid length
				const validInput = { name: 'A'.repeat(50) }
				expect(CreateGroupInputSchema.safeParse(validInput).success).toBe(true)

				// Too long
				const tooLong = { name: 'A'.repeat(51) }
				expect(CreateGroupInputSchema.safeParse(tooLong).success).toBe(false)
			})

			test('should validate description length limits', () => {
				// Valid length
				const validInput = { name: 'Test', description: 'B'.repeat(200) }
				expect(CreateGroupInputSchema.safeParse(validInput).success).toBe(true)

				// Too long
				const tooLong = { name: 'Test', description: 'B'.repeat(201) }
				expect(CreateGroupInputSchema.safeParse(tooLong).success).toBe(false)
			})

			test('should handle special characters in names', () => {
				const validInputs = [
					{ name: 'Family & Friends' },
					{ name: 'Group #1' },
					{ name: 'Café Group ☕' },
					{ name: 'Work-Team' },
				]

				for (const input of validInputs) {
					const result = CreateGroupInputSchema.safeParse(input)
					expect(result.success).toBe(true)
				}
			})
		})

		describe('UpdateGroupInputSchema', () => {
			test('should validate correct update group input', () => {
				const validInput = {
					id: 'group-123',
					name: 'Updated Group Name',
					description: 'Updated description',
				}

				const result = UpdateGroupInputSchema.safeParse(validInput)
				expect(result.success).toBe(true)
			})

			test('should validate partial updates', () => {
				const validInputs = [
					{ id: 'group-123', name: 'New Name' }, // only name
					{ id: 'group-123', description: 'New description' }, // only description
					{ id: 'group-123', description: '' }, // clear description
				]

				for (const input of validInputs) {
					const result = UpdateGroupInputSchema.safeParse(input)
					expect(result.success).toBe(true)
				}
			})

			test('should require id', () => {
				const invalidInputs = [
					{ name: 'New Name' }, // missing id
					{ description: 'New description' }, // missing id
					{}, // missing everything
				]

				for (const input of invalidInputs) {
					const result = UpdateGroupInputSchema.safeParse(input)
					expect(result.success).toBe(false)
				}
			})

			test('should validate name length limits when provided', () => {
				// Valid length
				const validInput = { id: 'group-123', name: 'A'.repeat(50) }
				expect(UpdateGroupInputSchema.safeParse(validInput).success).toBe(true)

				// Too long
				const tooLong = { id: 'group-123', name: 'A'.repeat(51) }
				expect(UpdateGroupInputSchema.safeParse(tooLong).success).toBe(false)

				// Empty name should fail
				const emptyName = { id: 'group-123', name: '' }
				expect(UpdateGroupInputSchema.safeParse(emptyName).success).toBe(false)
			})

			test('should validate description length limits when provided', () => {
				// Valid length
				const validInput = { id: 'group-123', description: 'B'.repeat(200) }
				expect(UpdateGroupInputSchema.safeParse(validInput).success).toBe(true)

				// Too long
				const tooLong = { id: 'group-123', description: 'B'.repeat(201) }
				expect(UpdateGroupInputSchema.safeParse(tooLong).success).toBe(false)
			})
		})

		describe('GetGroupDetailsInputSchema', () => {
			test('should validate correct get group details input', () => {
				const validInput = {
					id: 'group-123',
				}

				const result = GetGroupDetailsInputSchema.safeParse(validInput)
				expect(result.success).toBe(true)
			})

			test('should require id', () => {
				const result = GetGroupDetailsInputSchema.safeParse({})
				expect(result.success).toBe(false)
			})

			test('should handle different id formats', () => {
				const validInputs = [
					{ id: 'group-123' },
					{ id: 'cluid123456789' },
					{ id: 'uuid-format-id' },
				]

				for (const input of validInputs) {
					const result = GetGroupDetailsInputSchema.safeParse(input)
					expect(result.success).toBe(true)
				}
			})
		})

		describe('DeleteGroupInputSchema', () => {
			test('should validate correct delete group input', () => {
				const validInput = {
					id: 'group-123',
				}

				const result = DeleteGroupInputSchema.safeParse(validInput)
				expect(result.success).toBe(true)
			})

			test('should require id', () => {
				const result = DeleteGroupInputSchema.safeParse({})
				expect(result.success).toBe(false)
			})

			test('should handle different id formats', () => {
				const validInputs = [
					{ id: 'group-123' },
					{ id: 'cluid123456789' },
					{ id: 'uuid-format-id' },
				]

				for (const input of validInputs) {
					const result = DeleteGroupInputSchema.safeParse(input)
					expect(result.success).toBe(true)
				}
			})
		})
	})

	describe('router configuration', () => {
		test('should have query endpoints', () => {
			expect(groupRouter).toHaveProperty('getMyGroups')
			expect(groupRouter).toHaveProperty('getGroupDetails')
			expect(typeof groupRouter.getMyGroups).toBe('object')
			expect(typeof groupRouter.getGroupDetails).toBe('object')
		})

		test('should have mutation endpoints', () => {
			expect(groupRouter).toHaveProperty('createGroup')
			expect(groupRouter).toHaveProperty('updateGroup')
			expect(groupRouter).toHaveProperty('deleteGroup')
			expect(typeof groupRouter.createGroup).toBe('object')
			expect(typeof groupRouter.updateGroup).toBe('object')
			expect(typeof groupRouter.deleteGroup).toBe('object')
		})
	})
})
