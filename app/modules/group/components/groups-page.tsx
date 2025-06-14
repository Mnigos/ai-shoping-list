import { ExternalLink, Plus, Users } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/shared/components/ui/button'
import { useMyGroupsOverviewQuery } from '../hooks/use-my-groups-overview.query'
import { CreateGroupDialog } from './create-group-dialog'
import { GroupCard } from './group-card'
import { JoinGroupDialog } from './join-group-dialog'

export function GroupsPage() {
	const { data: groups } = useMyGroupsOverviewQuery()
	const [showJoinDialog, setShowJoinDialog] = useState(false)

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
