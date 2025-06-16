import { Plus, UserPlus } from 'lucide-react'
import { AnonymousUserGuard } from '~/shared/components/auth/anonymous-user-guard'
import { Button } from '~/shared/components/ui/button'
import { useMyGroupsQuery } from '../hooks/queries/use-my-groups.query'
import { CreateGroupDialog } from './create-group.modal'
import { GroupSelector } from './group.popover'
import { JoinGroupDialog } from './join-group.modal'

interface GroupInterfaceProps {
	className?: string
}

export function GroupInterface({ className }: GroupInterfaceProps) {
	const { data: groups, isLoading } = useMyGroupsQuery()

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

	const shouldShowGroupInterface = groups && groups.length > 1

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
