import { describe, expect, it } from 'vitest'
import {
	getCollaborativeGroups,
	getPersonalGroup,
	hasOnlyPersonalGroup,
	isGroupAdmin,
} from './helpers/group-helpers'
import type { GroupWithRole } from './helpers/group-optimistic-updates'

describe('Group Helpers', () => {
	const mockPersonalGroup: GroupWithRole = {
		id: 'personal-1',
		name: 'Personal Group',
		description: null,
		inviteCode: 'personal-code',
		isPersonal: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		myRole: 'ADMIN',
	}

	const mockCollaborativeGroup: GroupWithRole = {
		id: 'collab-1',
		name: 'Family Group',
		description: 'Family shopping list',
		inviteCode: 'family-code',
		isPersonal: false,
		createdAt: new Date(),
		updatedAt: new Date(),
		myRole: 'MEMBER',
	}

	describe('hasOnlyPersonalGroup', () => {
		it('should return true for empty groups array', () => {
			expect(hasOnlyPersonalGroup([])).toBe(true)
		})

		it('should return true for single personal group', () => {
			expect(hasOnlyPersonalGroup([mockPersonalGroup])).toBe(true)
		})

		it('should return false for multiple groups', () => {
			expect(
				hasOnlyPersonalGroup([mockPersonalGroup, mockCollaborativeGroup]),
			).toBe(false)
		})

		it('should return false for single collaborative group', () => {
			expect(hasOnlyPersonalGroup([mockCollaborativeGroup])).toBe(false)
		})
	})

	describe('isGroupAdmin', () => {
		it('should return true for admin role', () => {
			expect(isGroupAdmin(mockPersonalGroup)).toBe(true)
		})

		it('should return false for member role', () => {
			expect(isGroupAdmin(mockCollaborativeGroup)).toBe(false)
		})
	})

	describe('getPersonalGroup', () => {
		it('should return personal group when it exists', () => {
			const groups = [mockPersonalGroup, mockCollaborativeGroup]
			expect(getPersonalGroup(groups)).toBe(mockPersonalGroup)
		})

		it('should return undefined when no personal group exists', () => {
			const groups = [mockCollaborativeGroup]
			expect(getPersonalGroup(groups)).toBeUndefined()
		})
	})

	describe('getCollaborativeGroups', () => {
		it('should return only collaborative groups', () => {
			const groups = [mockPersonalGroup, mockCollaborativeGroup]
			const result = getCollaborativeGroups(groups)
			expect(result).toEqual([mockCollaborativeGroup])
		})

		it('should return empty array when no collaborative groups exist', () => {
			const groups = [mockPersonalGroup]
			const result = getCollaborativeGroups(groups)
			expect(result).toEqual([])
		})
	})
})
