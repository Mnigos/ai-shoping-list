import { ArrowLeft, Settings } from 'lucide-react'
import { Link } from 'react-router'
import { Chat } from '~/modules/chat/components/chat'
import { ShoppingList } from '~/modules/shopping-list/components/shopping-list'
import { Badge } from '~/shared/components/ui/badge'
import { Button } from '~/shared/components/ui/button'
import { useGroupQuery } from '../../hooks/queries/use-group.query'

interface GroupPageProps {
	groupId: string
}

export function GroupPage({ groupId }: Readonly<GroupPageProps>) {
	const { data: group } = useGroupQuery(groupId)

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

	return (
		<div className="container mx-auto p-6">
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
					<Link to={`/groups/${groupId}/settings`}>
						<Button variant="outline" size="sm">
							<Settings className="mr-2 h-4 w-4" />
							Settings
						</Button>
					</Link>
				</div>
			</div>

			<main className="grid grid-cols-2 gap-8">
				<ShoppingList groupId={groupId} />
				<Chat groupId={groupId} />
			</main>
		</div>
	)
}
