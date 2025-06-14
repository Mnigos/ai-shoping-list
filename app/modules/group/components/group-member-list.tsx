import type { GroupRole } from '@prisma/client'
import { ShieldIcon, UserIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/shared/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/shared/components/ui/dialog'
import {
	useRemoveMemberMutation,
	useUpdateRoleMutation,
} from '../hooks/use-member-management'
import type { GroupMember } from '../server/schemas'

interface GroupMemberListProps {
	groupId: string
	currentUserRole: GroupRole
	currentUserId: string
	isPersonalGroup?: boolean
	members: GroupMember[]
}

interface ConfirmDialogState {
	isOpen: boolean
	type: 'remove' | 'promote' | 'demote' | null
	member: {
		id: string
		name: string
		role: GroupRole
	} | null
}

export function GroupMemberList({
	groupId,
	currentUserRole,
	currentUserId,
	isPersonalGroup = false,
	members,
}: GroupMemberListProps) {
	const removeMemberMutation = useRemoveMemberMutation()
	const updateRoleMutation = useUpdateRoleMutation()

	const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
		isOpen: false,
		type: null,
		member: null,
	})

	const isCurrentUserAdmin = currentUserRole === 'ADMIN'
	const canManageMembers = isCurrentUserAdmin && !isPersonalGroup

	function handleRemoveMember(memberId: string, memberName: string) {
		setConfirmDialog({
			isOpen: true,
			type: 'remove',
			member: { id: memberId, name: memberName, role: 'MEMBER' },
		})
	}

	function handleUpdateRole(
		memberId: string,
		memberName: string,
		newRole: 'ADMIN' | 'MEMBER',
	) {
		setConfirmDialog({
			isOpen: true,
			type: newRole === 'ADMIN' ? 'promote' : 'demote',
			member: { id: memberId, name: memberName, role: newRole },
		})
	}

	function handleConfirmAction() {
		if (!confirmDialog.member || !confirmDialog.type) return

		if (confirmDialog.type === 'remove') {
			removeMemberMutation.mutate({
				groupId,
				memberId: confirmDialog.member.id,
			})
		} else {
			updateRoleMutation.mutate({
				groupId,
				memberId: confirmDialog.member.id,
				role: confirmDialog.member.role,
			})
		}

		setConfirmDialog({ isOpen: false, type: null, member: null })
	}

	function closeConfirmDialog() {
		setConfirmDialog({ isOpen: false, type: null, member: null })
	}

	if (!members?.length) {
		return (
			<div className="py-8 text-center text-muted-foreground">
				<UserIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
				<p>No members found</p>
			</div>
		)
	}

	return (
		<>
			<div className="space-y-2">
				{members.map(member => {
					const isCurrentUser = member.userId === currentUserId
					const canManageThisMember = canManageMembers && !isCurrentUser

					return (
						<div
							key={member.userId}
							className="flex items-center gap-3 rounded-lg border bg-card p-3"
						>
							{/* Avatar */}
							<div className="relative">
								{member.image ? (
									<img
										src={member.image}
										alt={member.name}
										className="h-10 w-10 rounded-full"
									/>
								) : (
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
										<UserIcon className="h-5 w-5 text-muted-foreground" />
									</div>
								)}
								{member.role === 'ADMIN' && (
									<div className="-bottom-1 -right-1 absolute flex h-5 w-5 items-center justify-center rounded-full bg-primary">
										<ShieldIcon className="h-3 w-3 text-primary-foreground" />
									</div>
								)}
							</div>

							{/* Member Info */}
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<p className="truncate font-medium text-sm">
										{member.name}
										{isCurrentUser && (
											<span className="ml-1 text-muted-foreground">(You)</span>
										)}
									</p>
								</div>
								<p className="text-muted-foreground text-xs">
									{member.role === 'ADMIN' ? 'Admin' : 'Member'} • Joined{' '}
									{new Date(member.joinedAt).toLocaleDateString()}
								</p>
							</div>

							{/* Actions */}
							{canManageThisMember && (
								<div className="flex gap-1">
									{member.role === 'MEMBER' ? (
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												handleUpdateRole(member.userId, member.name, 'ADMIN')
											}
										>
											<ShieldIcon className="mr-1 h-4 w-4" />
											Promote
										</Button>
									) : (
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												handleUpdateRole(member.userId, member.name, 'MEMBER')
											}
										>
											<UserIcon className="mr-1 h-4 w-4" />
											Demote
										</Button>
									)}
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											handleRemoveMember(member.userId, member.name)
										}
										className="text-destructive hover:text-destructive"
									>
										Remove
									</Button>
								</div>
							)}
						</div>
					)
				})}
			</div>

			{/* Confirmation Dialog */}
			<Dialog open={confirmDialog.isOpen} onOpenChange={closeConfirmDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{confirmDialog.type === 'remove' && 'Remove Member'}
							{confirmDialog.type === 'promote' && 'Promote to Admin'}
							{confirmDialog.type === 'demote' && 'Demote to Member'}
						</DialogTitle>
						<DialogDescription>
							{confirmDialog.type === 'remove' && (
								<>
									Are you sure you want to remove{' '}
									<strong>{confirmDialog.member?.name}</strong> from this group?
									They will lose access to the group and its shopping lists.
								</>
							)}
							{confirmDialog.type === 'promote' && (
								<>
									Are you sure you want to promote{' '}
									<strong>{confirmDialog.member?.name}</strong> to admin? They
									will be able to manage group members and settings.
								</>
							)}
							{confirmDialog.type === 'demote' && (
								<>
									Are you sure you want to demote{' '}
									<strong>{confirmDialog.member?.name}</strong> to member? They
									will lose admin privileges.
								</>
							)}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={closeConfirmDialog}>
							Cancel
						</Button>
						<Button
							variant={
								confirmDialog.type === 'remove' ? 'destructive' : 'default'
							}
							onClick={handleConfirmAction}
							disabled={
								removeMemberMutation.isPending || updateRoleMutation.isPending
							}
						>
							{confirmDialog.type === 'remove' && 'Remove Member'}
							{confirmDialog.type === 'promote' && 'Promote'}
							{confirmDialog.type === 'demote' && 'Demote'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
