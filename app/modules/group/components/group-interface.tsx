import { Plus, UserPlus } from 'lucide-react'
import { AnonymousUserGuard } from '~/shared/components/auth/anonymous-user-guard'
import { Button } from '~/shared/components/ui/button'
import { useActiveGroupData } from '../hooks/use-active-group'
import { CreateGroupDialog } from './create-group-dialog'
import { GroupSelector } from './group-selector'
import { JoinGroupDialog } from './join-group-dialog'

interface GroupInterfaceProps {
	className?: string
}

export function GroupInterface({ className }: GroupInterfaceProps) {
	const { shouldShowGroupInterface, isLoading } = useActiveGroupData()

	if (isLoading) {
		return (
			<div className={className}>
				<div
					className="h-9 w-32 animate-pulse rounded-md bg-muted"
					data-testid="loading-skeleton"
				/>
			</div>
		)
	}

	// Users with only personal groups see "Create Group" and "Join Group" buttons
	if (!shouldShowGroupInterface) {
		return (
			<div className={className}>
				<div className="flex items-center gap-2">
					<AnonymousUserGuard
						tooltipContent="Please sign up to create and join groups"
						fallback={
							<Button variant="outline" size="sm" disabled>
								<Plus className="mr-2 h-4 w-4" />
								Create Group
							</Button>
						}
					>
						<CreateGroupDialog>
							<Button variant="outline" size="sm">
								<Plus className="mr-2 h-4 w-4" />
								Create Group
							</Button>
						</CreateGroupDialog>
					</AnonymousUserGuard>

					<AnonymousUserGuard
						tooltipContent="Please sign up to create and join groups"
						fallback={
							<Button variant="ghost" size="sm" disabled>
								<UserPlus className="mr-2 h-4 w-4" />
								Join Group
							</Button>
						}
					>
						<JoinGroupDialog>
							<Button variant="ghost" size="sm">
								<UserPlus className="mr-2 h-4 w-4" />
								Join Group
							</Button>
						</JoinGroupDialog>
					</AnonymousUserGuard>
				</div>
			</div>
		)
	}

	// Users with multiple groups see the group selector
	return (
		<div className={className}>
			<GroupSelector />
		</div>
	)
}

/**
 * Compact version of the group interface for mobile/smaller spaces
 */
export function CompactGroupInterface({ className }: GroupInterfaceProps) {
	const { shouldShowGroupInterface, isLoading } = useActiveGroupData()

	if (isLoading) {
		return (
			<div className={className}>
				<div className="h-8 w-8 animate-pulse rounded-md bg-muted" />
			</div>
		)
	}

	// Users with only personal groups see compact "+" and join buttons
	if (!shouldShowGroupInterface) {
		return (
			<div className={className}>
				<div className="flex items-center gap-1">
					<AnonymousUserGuard
						tooltipContent="Please sign up to create groups"
						fallback={
							<Button variant="ghost" size="sm" disabled>
								<Plus className="h-4 w-4" />
							</Button>
						}
					>
						<CreateGroupDialog>
							<Button variant="ghost" size="sm">
								<Plus className="h-4 w-4" />
							</Button>
						</CreateGroupDialog>
					</AnonymousUserGuard>

					<AnonymousUserGuard
						tooltipContent="Please sign up to join groups"
						fallback={
							<Button variant="ghost" size="sm" disabled>
								<UserPlus className="h-4 w-4" />
							</Button>
						}
					>
						<JoinGroupDialog>
							<Button variant="ghost" size="sm">
								<UserPlus className="h-4 w-4" />
							</Button>
						</JoinGroupDialog>
					</AnonymousUserGuard>
				</div>
			</div>
		)
	}

	// Users with multiple groups see a compact group selector
	return (
		<div className={className}>
			<GroupSelector className="w-auto" />
		</div>
	)
}
