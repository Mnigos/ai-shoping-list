import { UsersIcon } from 'lucide-react'
import { Button } from '~/shared/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '~/shared/components/ui/dialog'
import { useLeaveGroupMutation } from '../hooks/use-member-management'
import { GroupMemberList } from './group-member-list'

interface MemberManagementDialogProps {
	groupId: string
	groupName: string
	currentUserRole: 'ADMIN' | 'MEMBER'
	currentUserId: string
	isPersonalGroup?: boolean
	memberCount: number
}

export function MemberManagementDialog({
	groupId,
	groupName,
	currentUserRole,
	currentUserId,
	isPersonalGroup = false,
	memberCount,
}: MemberManagementDialogProps) {
	const leaveGroupMutation = useLeaveGroupMutation()

	function handleLeaveGroup() {
		if (
			confirm(
				'Are you sure you want to leave this group? You will lose access to the group and its shopping lists.',
			)
		) {
			leaveGroupMutation.mutate({ groupId })
		}
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline" className="w-full justify-start">
					<UsersIcon className="mr-2 h-4 w-4" />
					Manage Members ({memberCount})
				</Button>
			</DialogTrigger>
			<DialogContent className="flex max-h-[80vh] max-w-2xl flex-col overflow-hidden">
				<DialogHeader>
					<DialogTitle>Group Members</DialogTitle>
					<DialogDescription>
						Manage members of "{groupName}".
						{currentUserRole === 'ADMIN' &&
							!isPersonalGroup &&
							' As an admin, you can promote, demote, or remove members.'}
					</DialogDescription>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto">
					<GroupMemberList
						groupId={groupId}
						currentUserRole={currentUserRole}
						currentUserId={currentUserId}
						isPersonalGroup={isPersonalGroup}
					/>
				</div>

				{/* Leave Group Action */}
				{!isPersonalGroup && (
					<div className="mt-4 border-t pt-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-sm">Leave Group</p>
								<p className="text-muted-foreground text-xs">
									You will lose access to this group and its shopping lists
								</p>
							</div>
							<Button
								variant="destructive"
								size="sm"
								onClick={handleLeaveGroup}
								disabled={leaveGroupMutation.isPending}
							>
								Leave Group
							</Button>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	)
}
