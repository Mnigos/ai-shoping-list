import { vi } from 'vitest'
import { shoppingListRouter } from './shopping-list.router'
import {
	AddItemInputSchema,
	DeleteItemInputSchema,
	ExecuteActionsInputSchema,
	ToggleCompleteInputSchema,
	UpdateItemInputSchema,
} from './shopping-list.service'

vi.mock('./shopping-list.procedure', () => ({
	shoppingListProcedure: {
		query: vi.fn().mockReturnThis(),
		input: vi.fn().mockReturnThis(),
		mutation: vi.fn().mockReturnThis(),
	},
}))

describe('ShoppingListRouter', () => {
	describe('structure', () => {
		test('should have all required routes', () => {
			const expectedRoutes = [
				'getItems',
				'executeActions',
				'addItem',
				'updateItem',
				'toggleComplete',
				'deleteItem',
			]

			for (const route of expectedRoutes) {
				expect(shoppingListRouter).toHaveProperty(route)
			}
		})

		test('should define routes as TRPCRouterRecord', () => {
			expect(shoppingListRouter).toBeDefined()
			expect(typeof shoppingListRouter).toBe('object')
		})
	})

	describe('input schemas', () => {
		describe('AddItemInputSchema', () => {
			test('should validate correct add item input', () => {
				const validInput = {
					name: 'apples',
					amount: 3,
				}

				const result = AddItemInputSchema.safeParse(validInput)
				expect(result.success).toBe(true)
			})

			test('should require name but amount has default', () => {
				// Name is required
				const noName = {}
				expect(AddItemInputSchema.safeParse(noName).success).toBe(false)

				// Amount has default, so missing amount is OK
				const onlyName = { name: 'apples' }
				const result = AddItemInputSchema.safeParse(onlyName)
				expect(result.success).toBe(true)
				if (result.success) {
					expect(result.data.amount).toBe(1) // default value
				}
			})

			test('should validate amount is positive', () => {
				const invalidInputs = [
					{ name: 'apples', amount: 0 },
					{ name: 'apples', amount: -1 },
				]

				for (const input of invalidInputs) {
					const result = AddItemInputSchema.safeParse(input)
					expect(result.success).toBe(false)
				}
			})

			test('should require non-empty name', () => {
				const invalidInput = { name: '', amount: 1 }
				const result = AddItemInputSchema.safeParse(invalidInput)
				expect(result.success).toBe(false)
			})

			test('should handle string names correctly', () => {
				const validInputs = [
					{ name: 'simple', amount: 1 },
					{ name: 'with spaces', amount: 1 },
					{ name: 'with-dashes', amount: 1 },
					{ name: 'émojis 🍎', amount: 1 },
				]

				for (const input of validInputs) {
					const result = AddItemInputSchema.safeParse(input)
					expect(result.success).toBe(true)
				}
			})
		})

		describe('UpdateItemInputSchema', () => {
			test('should validate correct update item input', () => {
				const validInput = {
					id: 'item-123',
					amount: 5,
				}

				const result = UpdateItemInputSchema.safeParse(validInput)
				expect(result.success).toBe(true)
			})

			test('should require id and amount', () => {
				const invalidInputs = [
					{ amount: 3 }, // missing id
					{ id: 'item-123' }, // missing amount
					{}, // missing both
				]

				for (const input of invalidInputs) {
					const result = UpdateItemInputSchema.safeParse(input)
					expect(result.success).toBe(false)
				}
			})

			test('should validate amount is positive', () => {
				const invalidInputs = [
					{ id: 'item-123', amount: 0 },
					{ id: 'item-123', amount: -1 },
				]

				for (const input of invalidInputs) {
					const result = UpdateItemInputSchema.safeParse(input)
					expect(result.success).toBe(false)
				}
			})
		})

		describe('ToggleCompleteInputSchema', () => {
			test('should validate correct toggle complete input', () => {
				const validInput = {
					id: 'item-123',
				}

				const result = ToggleCompleteInputSchema.safeParse(validInput)
				expect(result.success).toBe(true)
			})

			test('should require id', () => {
				const result = ToggleCompleteInputSchema.safeParse({})
				expect(result.success).toBe(false)
			})
		})

		describe('DeleteItemInputSchema', () => {
			test('should validate correct delete item input', () => {
				const validInput = {
					id: 'item-123',
				}

				const result = DeleteItemInputSchema.safeParse(validInput)
				expect(result.success).toBe(true)
			})

			test('should require id', () => {
				const result = DeleteItemInputSchema.safeParse({})
				expect(result.success).toBe(false)
			})
		})

		describe('ExecuteActionsInputSchema', () => {
			test('should validate correct execute actions input', () => {
				const validInput = {
					actions: [
						{
							action: 'add',
							name: 'apples',
							amount: 3,
						},
						{
							action: 'update',
							name: 'bananas',
							amount: 2,
						},
					],
				}

				const result = ExecuteActionsInputSchema.safeParse(validInput)
				expect(result.success).toBe(true)
			})

			test('should validate empty actions array', () => {
				const validInput = {
					actions: [],
				}

				const result = ExecuteActionsInputSchema.safeParse(validInput)
				expect(result.success).toBe(true)
			})

			test('should validate action types', () => {
				const validActions = ['add', 'update', 'delete', 'complete']

				for (const action of validActions) {
					const input = {
						actions: [
							{
								action,
								name: 'test-item',
								amount: 1, // amount is optional in schema but let's include it
							},
						],
					}

					const result = ExecuteActionsInputSchema.safeParse(input)
					expect(result.success).toBe(true)
				}
			})

			test('should allow optional amount for all actions', () => {
				// The ShoppingListActionSchema has amount as optional for all actions
				const validInputs = [
					{
						actions: [
							{
								action: 'add',
								name: 'apples',
								// amount is optional in schema
							},
						],
					},
					{
						actions: [
							{
								action: 'update',
								name: 'bananas',
								// amount is optional in schema
							},
						],
					},
					{
						actions: [
							{
								action: 'delete',
								name: 'oranges',
							},
						],
					},
					{
						actions: [
							{
								action: 'complete',
								name: 'milk',
							},
						],
					},
				]

				for (const input of validInputs) {
					const result = ExecuteActionsInputSchema.safeParse(input)
					expect(result.success).toBe(true)
				}
			})

			test('should validate amount when provided', () => {
				const invalidInput = {
					actions: [
						{
							action: 'add',
							name: 'apples',
							amount: 0, // invalid amount
						},
					],
				}

				const result = ExecuteActionsInputSchema.safeParse(invalidInput)
				expect(result.success).toBe(false)
			})

			test('should require name for all actions', () => {
				const invalidInput = {
					actions: [
						{
							action: 'add',
							// missing name
							amount: 1,
						},
					],
				}

				const result = ExecuteActionsInputSchema.safeParse(invalidInput)
				expect(result.success).toBe(false)
			})
		})
	})

	describe('edge cases', () => {
		test('should handle special characters in item names', () => {
			const specialChars = [
				'café ☕',
				'émoji 🍎',
				'quotes "test"',
				"apostrophe's",
				'numbers 123',
				'symbols !@#$%',
			]

			for (const name of specialChars) {
				const input = { name, amount: 1 }
				const result = AddItemInputSchema.safeParse(input)
				expect(result.success).toBe(true)
			}
		})

		test('should handle very long item names', () => {
			const longName = 'A'.repeat(1000)
			const input = { name: longName, amount: 1 }

			const result = AddItemInputSchema.safeParse(input)
			expect(result.success).toBe(true)
		})

		test('should handle large amounts', () => {
			const input = { name: 'test', amount: 999999 }

			const result = AddItemInputSchema.safeParse(input)
			expect(result.success).toBe(true)
		})

		test('should handle many actions in execute actions', () => {
			const manyActions = Array.from({ length: 100 }, (_, i) => ({
				action: 'add' as const,
				name: `item-${i}`,
				amount: i + 1,
			}))

			const input = { actions: manyActions }
			const result = ExecuteActionsInputSchema.safeParse(input)
			expect(result.success).toBe(true)
		})

		test('should handle mixed action types in execute actions', () => {
			const mixedActions = [
				{ action: 'add' as const, name: 'apples', amount: 3 },
				{ action: 'update' as const, name: 'bananas', amount: 2 },
				{ action: 'delete' as const, name: 'oranges' },
				{ action: 'complete' as const, name: 'milk' },
			]

			const input = { actions: mixedActions }
			const result = ExecuteActionsInputSchema.safeParse(input)
			expect(result.success).toBe(true)
		})
	})
})
