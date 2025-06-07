import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { GroupSelector } from './group-selector'

// Mock the hooks
vi.mock('../hooks/use-active-group', () => ({
	useActiveGroupData: vi.fn(),
}))

const { useActiveGroupData } = await import('../hooks/use-active-group')

function renderWithQueryClient(component: React.ReactElement) {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	})

	return render(
		<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>,
	)
}

describe('GroupSelector', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('shows loading state when data is loading', () => {
		vi.mocked(useActiveGroupData).mockReturnValue({
			shouldShowGroupInterface: true,
			isLoading: true,
			activeGroup: null,
			activeGroupId: null,
			setActiveGroup: vi.fn(),
			isPersonalGroup: false,
			canManageGroup: false,
			groupName: '',
			availableGroups: [],
		})

		renderWithQueryClient(<GroupSelector />)

		expect(screen.getByTestId('group-selector-loading')).toBeInTheDocument()
	})

	it('renders nothing when user has only one group', () => {
		const mockPersonalGroup = {
			id: '1',
			name: 'Personal',
			description: null,
			inviteCode: 'personal-code',
			isPersonal: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			myRole: 'ADMIN' as const,
		}

		vi.mocked(useActiveGroupData).mockReturnValue({
			shouldShowGroupInterface: false,
			isLoading: false,
			activeGroup: mockPersonalGroup,
			activeGroupId: '1',
			setActiveGroup: vi.fn(),
			isPersonalGroup: true,
			canManageGroup: true,
			groupName: 'Personal',
			availableGroups: [mockPersonalGroup],
		})

		const { container } = renderWithQueryClient(<GroupSelector />)

		expect(container.firstChild).toBeNull()
	})

	it('renders group selector with multiple groups', () => {
		const mockGroup = {
			id: '1',
			name: 'Test Group',
			description: null,
			inviteCode: 'test-code',
			isPersonal: false,
			createdAt: new Date(),
			updatedAt: new Date(),
			myRole: 'MEMBER' as const,
		}
		const mockPersonalGroup = {
			id: '2',
			name: 'Personal',
			description: null,
			inviteCode: 'personal-code',
			isPersonal: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			myRole: 'ADMIN' as const,
		}

		vi.mocked(useActiveGroupData).mockReturnValue({
			shouldShowGroupInterface: true,
			isLoading: false,
			activeGroup: mockGroup,
			activeGroupId: '1',
			setActiveGroup: vi.fn(),
			isPersonalGroup: false,
			canManageGroup: false,
			groupName: 'Test Group',
			availableGroups: [mockGroup, mockPersonalGroup],
		})

		renderWithQueryClient(<GroupSelector />)

		expect(screen.getByText('Test Group')).toBeInTheDocument()
		expect(screen.getByRole('button')).toBeInTheDocument()
	})

	it('calls setActiveGroup when a different group is selected', () => {
		const mockSetActiveGroup = vi.fn()
		const mockGroup = {
			id: '1',
			name: 'Test Group',
			description: null,
			inviteCode: 'test-code',
			isPersonal: false,
			createdAt: new Date(),
			updatedAt: new Date(),
			myRole: 'MEMBER' as const,
		}
		const mockPersonalGroup = {
			id: '2',
			name: 'Personal',
			description: null,
			inviteCode: 'personal-code',
			isPersonal: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			myRole: 'ADMIN' as const,
		}

		vi.mocked(useActiveGroupData).mockReturnValue({
			shouldShowGroupInterface: true,
			isLoading: false,
			activeGroup: mockGroup,
			activeGroupId: '1',
			setActiveGroup: mockSetActiveGroup,
			isPersonalGroup: false,
			canManageGroup: false,
			groupName: 'Test Group',
			availableGroups: [mockGroup, mockPersonalGroup],
		})

		renderWithQueryClient(<GroupSelector />)

		// Click the trigger to open the popover
		fireEvent.click(screen.getByRole('button'))

		// Click on the Personal group option (use the font-medium one)
		fireEvent.click(screen.getByRole('button', { name: /Personal/ }))

		expect(mockSetActiveGroup).toHaveBeenCalledWith('2')
	})
})
