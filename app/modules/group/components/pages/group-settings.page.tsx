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
import { Link } from 'react-router'
import { Badge } from '~/shared/components/ui/badge'
import { Button } from '~/shared/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/shared/components/ui/card'
import { Input } from '~/shared/components/ui/input'
import { Label } from '~/shared/components/ui/label'
import { useRegenerateInviteCodeMutation } from '../../hooks/mutations/use-regenerate-invite-code.mutation'
import { useGroupDetailsQuery } from '../../hooks/queries/use-group-details.query'
import { GroupMemberList } from '../group-member-list'
import { DeleteGroupDialog } from '../modals/delete-group.modal'
import { EditGroupDialog } from '../modals/edit-group.modal'
import { InviteLinkModal } from '../modals/invite-link.modal'

interface GroupSettingsPageProps {
	groupId: string
}

export function GroupSettingsPage({
	groupId,
}: Readonly<GroupSettingsPageProps>) {
	const { data: group } = useGroupDetailsQuery(groupId)

	const regenerateCodeMutation = useRegenerateInviteCodeMutation()

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

	function handleGenerateInviteCode() {
		regenerateCodeMutation.mutate({ id: groupId })
	}

	function handleCopyInviteCode() {
		if (group?.inviteCode) {
			navigator.clipboard.writeText(group.inviteCode)
		}
	}

	return (
		<div className="container mx-auto p-6">
			{/* Header */}
			<div className="mb-6 flex items-center gap-4">
				<Link to={`/groups/${groupId}`}>
					<Button variant="ghost" size="sm">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Group
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
								<EditGroupDialog>
									<Button variant="outline" size="sm">
										<Edit className="mr-2 h-4 w-4" />
										Edit Group
									</Button>
								</EditGroupDialog>
								<DeleteGroupDialog>
									<Button variant="destructive" size="sm">
										<Trash2 className="mr-2 h-4 w-4" />
										Delete Group
									</Button>
								</DeleteGroupDialog>
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
									disabled={regenerateCodeMutation.isPending}
								>
									<UserPlus className="mr-2 h-4 w-4" />
									{regenerateCodeMutation.isPending
										? 'Generating...'
										: 'Generate New Code'}
								</Button>
								<InviteLinkModal>
									<Button variant="outline" size="sm">
										<LinkIcon className="mr-2 h-4 w-4" />
										Create Invite Link
									</Button>
								</InviteLinkModal>
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
						Members ({group.membersCount})
					</CardTitle>
					<CardDescription>
						Manage group members and their roles
					</CardDescription>
				</CardHeader>
				<CardContent>
					{group.members && (
						<GroupMemberList
							groupId={groupId}
							currentUserRole={group.myRole}
							isPersonalGroup={group.isPersonal}
							members={group.members}
						/>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
