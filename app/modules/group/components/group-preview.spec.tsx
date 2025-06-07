import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { InviteCodeValidationResult } from '../server/group-invite.service'
import { GroupPreview } from './group-preview'

const mockGroupInfo: InviteCodeValidationResult = {
	id: 'group-1',
	name: 'Test Group',
	description: 'A test group for testing',
	createdAt: new Date('2024-01-15T10:00:00Z'),
	memberCount: 5,
	itemCount: 12,
	isAlreadyMember: false,
}

describe('GroupPreview', () => {
	it('renders group name and description', () => {
		render(<GroupPreview groupInfo={mockGroupInfo} />)

		expect(screen.getByText('Test Group')).toBeInTheDocument()
		expect(screen.getByText('A test group for testing')).toBeInTheDocument()
	})

	it('renders group without description', () => {
		const groupWithoutDescription = {
			...mockGroupInfo,
			description: null,
		}

		render(<GroupPreview groupInfo={groupWithoutDescription} />)

		expect(screen.getByText('Test Group')).toBeInTheDocument()
		expect(
			screen.queryByText('A test group for testing'),
		).not.toBeInTheDocument()
	})

	it('displays member count correctly', () => {
		render(<GroupPreview groupInfo={mockGroupInfo} />)

		expect(screen.getByText('5 members')).toBeInTheDocument()
	})

	it('displays singular member count', () => {
		const groupWithOneMember = {
			...mockGroupInfo,
			memberCount: 1,
		}

		render(<GroupPreview groupInfo={groupWithOneMember} />)

		expect(screen.getByText('1 member')).toBeInTheDocument()
	})

	it('displays item count correctly', () => {
		render(<GroupPreview groupInfo={mockGroupInfo} />)

		expect(screen.getByText('12 items')).toBeInTheDocument()
	})

	it('displays singular item count', () => {
		const groupWithOneItem = {
			...mockGroupInfo,
			itemCount: 1,
		}

		render(<GroupPreview groupInfo={groupWithOneItem} />)

		expect(screen.getByText('1 item')).toBeInTheDocument()
	})

	it('displays zero counts correctly', () => {
		const emptyGroup = {
			...mockGroupInfo,
			memberCount: 0,
			itemCount: 0,
		}

		render(<GroupPreview groupInfo={emptyGroup} />)

		expect(screen.getByText('0 members')).toBeInTheDocument()
		expect(screen.getByText('0 items')).toBeInTheDocument()
	})

	it('formats creation date correctly', () => {
		render(<GroupPreview groupInfo={mockGroupInfo} />)

		expect(screen.getByText('Created January 15, 2024')).toBeInTheDocument()
	})

	it('applies custom className', () => {
		const { container } = render(
			<GroupPreview groupInfo={mockGroupInfo} className="custom-class" />,
		)

		expect(container.firstChild).toHaveClass('custom-class')
	})

	it('renders all required icons', () => {
		const { container } = render(<GroupPreview groupInfo={mockGroupInfo} />)

		// Check for Users icons (by checking for lucide-users class)
		const usersIcons = container.querySelectorAll('.lucide-users')
		expect(usersIcons).toHaveLength(2) // One in title, one in member count

		// Check for ShoppingCart icon
		const shoppingCartIcon = container.querySelector('.lucide-shopping-cart')
		expect(shoppingCartIcon).toBeInTheDocument()

		// Check for Calendar icon
		const calendarIcon = container.querySelector('.lucide-calendar')
		expect(calendarIcon).toBeInTheDocument()
	})
})
