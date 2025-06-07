import { useQuery } from '@tanstack/react-query'
import {
	ArrowLeft,
	Copy,
	Edit,
	Link as LinkIcon,
	Settings,
	Trash2,
	UserPlus,
	Users,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useTRPC } from '~/lib/trpc/react'
import { Badge } from '~/shared/components/ui/badge'
import { Button } from '~/shared/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/shared/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/shared/components/ui/dialog'
import { Input } from '~/shared/components/ui/input'
import { Label } from '~/shared/components/ui/label'
import { Textarea } from '~/shared/components/ui/textarea'
import { useDeleteGroupMutation } from '../hooks/use-delete-group-mutation'
import { useGenerateInviteCodeMutation } from '../hooks/use-generate-invite-code-mutation'
import { useUpdateGroupMutation } from '../hooks/use-update-group-mutation'
import { GroupMemberList } from './group-member-list'
import { InviteLinkDialog } from './invite-link-dialog'

interface GroupSettingsPageProps {
	groupId: string
}

export function GroupSettingsPage({ groupId }: GroupSettingsPageProps) {
	const navigate = useNavigate()
	const trpc = useTRPC()

	const { data: group, isLoading } = useQuery(
		trpc.group.getGroupDetails.queryOptions({ id: groupId }),
	)
	const { data: members } = useQuery(
		trpc.group.getMembers.queryOptions({ groupId }),
	)

	const [showDeleteDialog, setShowDeleteDialog] = useState(false)
	const [showEditDialog, setShowEditDialog] = useState(false)
	const [showInviteDialog, setShowInviteDialog] = useState(false)
	const [editForm, setEditForm] = useState({ name: '', description: '' })

	const updateGroupMutation = useUpdateGroupMutation()
	const deleteGroupMutation = useDeleteGroupMutation()
	const generateCodeMutation = useGenerateInviteCodeMutation()

	if (isLoading) {
		return (
			<div className="container mx-auto p-6">
				<div className="animate-pulse space-y-6">
					<div className="h-8 w-1/3 rounded bg-gray-200" />
					<div className="grid gap-6 md:grid-cols-2">
						<div className="h-64 rounded bg-gray-200" />
						<div className="h-64 rounded bg-gray-200" />
					</div>
				</div>
			</div>
		)
	}

	if (!group) {
		return (
			<div className="container mx-auto p-6">
				<div className="py-12 text-center">
					<h2 className="mb-2 font-bold text-2xl text-gray-900">
						Group not found
					</h2>
					<p className="mb-4 text-gray-500">
						The group you're looking for doesn't exist or you don't have access
						to it.
					</p>
					<Link to="/groups">
						<Button>Back to Groups</Button>
					</Link>
				</div>
			</div>
		)
	}

	const isAdmin = group.myRole === 'ADMIN'
	const canManageGroup = isAdmin && !group.isPersonal

	function handleEditGroup() {
		setEditForm({ name: group.name, description: group.description || '' })
		setShowEditDialog(true)
	}

	function handleUpdateGroup() {
		updateGroupMutation.mutate(
			{
				id: groupId,
				name: editForm.name,
				description: editForm.description || undefined,
			},
			{
				onSuccess: () => {
					setShowEditDialog(false)
				},
			},
		)
	}

	function handleDeleteGroup() {
		deleteGroupMutation.mutate(
			{ id: groupId },
			{
				onSuccess: () => {
					navigate('/groups')
				},
			},
		)
	}

	function handleGenerateInviteCode() {
		generateCodeMutation.mutate({ groupId })
	}

	function handleCopyInviteCode() {
		if (group.inviteCode) {
			navigator.clipboard.writeText(group.inviteCode)
		}
	}

	return (
		<div className="container mx-auto p-6">
			{/* Header */}
			<div className="mb-6 flex items-center gap-4">
				<Link to="/groups">
					<Button variant="ghost" size="sm">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Groups
					</Button>
				</Link>
				<div className="flex-1">
					<h1 className="font-bold text-3xl">{group.name}</h1>
					{group.description && (
						<p className="mt-1 text-gray-600">{group.description}</p>
					)}
				</div>
				<div className="flex items-center gap-2">
					{group.isPersonal && <Badge variant="secondary">Personal</Badge>}
					<Badge variant={isAdmin ? 'default' : 'outline'}>
						{group.myRole}
					</Badge>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				{/* Group Settings */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Settings className="h-5 w-5" />
							Group Settings
						</CardTitle>
						<CardDescription>
							Manage group information and settings
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<Label className="font-medium text-sm">Group Name</Label>
							<p className="text-gray-600 text-sm">{group.name}</p>
						</div>
						{group.description && (
							<div>
								<Label className="font-medium text-sm">Description</Label>
								<p className="text-gray-600 text-sm">{group.description}</p>
							</div>
						)}
						<div>
							<Label className="font-medium text-sm">Created</Label>
							<p className="text-gray-600 text-sm">
								{new Date(group.createdAt).toLocaleDateString()}
							</p>
						</div>

						{canManageGroup && (
							<div className="flex gap-2 pt-4">
								<Button onClick={handleEditGroup} variant="outline" size="sm">
									<Edit className="mr-2 h-4 w-4" />
									Edit Group
								</Button>
								<Button
									onClick={() => setShowDeleteDialog(true)}
									variant="destructive"
									size="sm"
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete Group
								</Button>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Invite Management */}
				{canManageGroup && (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<LinkIcon className="h-5 w-5" />
								Invite Management
							</CardTitle>
							<CardDescription>
								Generate invite codes and links for new members
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<Label className="font-medium text-sm">
									Current Invite Code
								</Label>
								<div className="mt-1 flex gap-2">
									<Input
										value={group.inviteCode || 'No code generated'}
										readOnly
										className="font-mono text-sm"
									/>
									<Button
										onClick={handleCopyInviteCode}
										variant="outline"
										size="sm"
										disabled={!group.inviteCode}
									>
										<Copy className="h-4 w-4" />
									</Button>
								</div>
							</div>

							<div className="flex gap-2">
								<Button
									onClick={handleGenerateInviteCode}
									variant="outline"
									size="sm"
									disabled={generateCodeMutation.isPending}
								>
									<UserPlus className="mr-2 h-4 w-4" />
									{generateCodeMutation.isPending
										? 'Generating...'
										: 'Generate New Code'}
								</Button>
								<Button
									onClick={() => setShowInviteDialog(true)}
									variant="outline"
									size="sm"
								>
									<LinkIcon className="mr-2 h-4 w-4" />
									Create Invite Link
								</Button>
							</div>
						</CardContent>
					</Card>
				)}
			</div>

			{/* Members Section */}
			<Card className="mt-6">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Users className="h-5 w-5" />
						Members ({members?.length || 0})
					</CardTitle>
					<CardDescription>
						Manage group members and their roles
					</CardDescription>
				</CardHeader>
				<CardContent>
					{members && (
						<GroupMemberList
							groupId={groupId}
							currentUserRole={group.myRole}
							currentUserId={'current-user-id'}
							isPersonalGroup={group.isPersonal}
						/>
					)}
				</CardContent>
			</Card>

			{/* Edit Group Dialog */}
			<Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Group</DialogTitle>
						<DialogDescription>
							Update group information and settings
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="edit-name">Group Name</Label>
							<Input
								id="edit-name"
								value={editForm.name}
								onChange={e =>
									setEditForm(prev => ({ ...prev, name: e.target.value }))
								}
								maxLength={50}
							/>
						</div>
						<div>
							<Label htmlFor="edit-description">Description (Optional)</Label>
							<Textarea
								id="edit-description"
								value={editForm.description}
								onChange={e =>
									setEditForm(prev => ({
										...prev,
										description: e.target.value,
									}))
								}
								maxLength={200}
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowEditDialog(false)}
							disabled={updateGroupMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							onClick={handleUpdateGroup}
							disabled={updateGroupMutation.isPending || !editForm.name.trim()}
						>
							{updateGroupMutation.isPending ? 'Updating...' : 'Update Group'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Group Dialog */}
			<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Group</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete "{group.name}"? This action cannot
							be undone. All shopping list items in this group will be
							permanently deleted.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowDeleteDialog(false)}
							disabled={deleteGroupMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteGroup}
							disabled={deleteGroupMutation.isPending}
						>
							{deleteGroupMutation.isPending ? 'Deleting...' : 'Delete Group'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Invite Link Dialog */}
			{showInviteDialog && (
				<InviteLinkDialog
					groupId={groupId}
					groupName={group.name}
					isOpen={showInviteDialog}
					onClose={() => setShowInviteDialog(false)}
				/>
			)}
		</div>
	)
}
