import { ExternalLink, Plus, Settings, Users } from 'lucide-react'
import { useState } from 'react'
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
import { useGroups } from '../hooks/use-groups'
import { CreateGroupDialog } from './create-group-dialog'
import { JoinGroupDialog } from './join-group-dialog'

export function GroupsPage() {
	const { data: groups, isLoading } = useGroups()
	const [showJoinDialog, setShowJoinDialog] = useState(false)

	if (isLoading) {
		return (
			<div className="container mx-auto p-6">
				<div className="mb-6 flex items-center justify-between">
					<h1 className="font-bold text-3xl">My Groups</h1>
				</div>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<Card key={i} className="animate-pulse">
							<CardHeader>
								<div className="mb-2 h-6 w-3/4 rounded bg-gray-200" />
								<div className="h-4 w-full rounded bg-gray-200" />
							</CardHeader>
							<CardContent>
								<div className="h-4 w-1/2 rounded bg-gray-200" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		)
	}

	const personalGroups = groups?.filter(group => group.isPersonal) || []
	const collaborativeGroups = groups?.filter(group => !group.isPersonal) || []

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="font-bold text-3xl">My Groups</h1>
				<div className="flex gap-2">
					<Button onClick={() => setShowJoinDialog(true)} variant="outline">
						<ExternalLink className="mr-2 h-4 w-4" />
						Join Group
					</Button>
					<CreateGroupDialog>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Create Group
						</Button>
					</CreateGroupDialog>
				</div>
			</div>

			{collaborativeGroups.length > 0 && (
				<div className="mb-8">
					<h2 className="mb-4 font-semibold text-xl">Collaborative Groups</h2>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{collaborativeGroups.map(group => (
							<GroupCard key={group.id} group={group} />
						))}
					</div>
				</div>
			)}

			{personalGroups.length > 0 && (
				<div>
					<h2 className="mb-4 font-semibold text-xl">Personal Groups</h2>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{personalGroups.map(group => (
							<GroupCard key={group.id} group={group} />
						))}
					</div>
				</div>
			)}

			{groups?.length === 0 && (
				<div className="py-12 text-center">
					<Users className="mx-auto mb-4 h-12 w-12 text-gray-400" />
					<h3 className="mb-2 font-medium text-gray-900 text-lg">
						No groups yet
					</h3>
					<p className="mb-4 text-gray-500">
						Create your first group to start collaborating on shopping lists
					</p>
					<CreateGroupDialog>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Create Your First Group
						</Button>
					</CreateGroupDialog>
				</div>
			)}

			{showJoinDialog && (
				<JoinGroupDialog onGroupJoined={() => setShowJoinDialog(false)}>
					<div />
				</JoinGroupDialog>
			)}
		</div>
	)
}

interface GroupCardProps {
	group: {
		id: string
		name: string
		description?: string | null
		isPersonal: boolean
		myRole: 'ADMIN' | 'MEMBER'
		members?: Array<{
			id: string
			user: {
				id: string
				name: string | null
				email: string
			}
		}>
		_count?: {
			shoppingListItems: number
		}
	}
}

function GroupCard({ group }: GroupCardProps) {
	return (
		<Card className="transition-shadow hover:shadow-md">
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<CardTitle className="text-lg">{group.name}</CardTitle>
						{group.description && (
							<CardDescription className="mt-1">
								{group.description}
							</CardDescription>
						)}
					</div>
					<div className="flex items-center gap-2">
						{group.isPersonal && (
							<Badge variant="secondary" className="text-xs">
								Personal
							</Badge>
						)}
						<Badge
							variant={group.myRole === 'ADMIN' ? 'default' : 'outline'}
							className="text-xs"
						>
							{group.myRole}
						</Badge>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between">
					<div className="flex items-center text-gray-500 text-sm">
						<Users className="mr-1 h-4 w-4" />
						{group.members?.length || 0} member
						{(group.members?.length || 0) !== 1 ? 's' : ''}
					</div>
					<Link to={`/groups/${group.id}`}>
						<Button variant="ghost" size="sm">
							<Settings className="mr-1 h-4 w-4" />
							Manage
						</Button>
					</Link>
				</div>
			</CardContent>
		</Card>
	)
}
