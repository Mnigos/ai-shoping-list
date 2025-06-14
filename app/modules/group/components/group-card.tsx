import { Settings, Users } from 'lucide-react'
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
import type { Group } from '../server/schemas'

interface GroupCardProps {
	group: Group
}

export function GroupCard({ group }: Readonly<GroupCardProps>) {
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
						{group.membersCount} member
						{group.membersCount !== 1 ? 's' : ''}
					</div>
					<div className="flex gap-1">
						<Link to={`/groups/${group.id}`}>
							<Button variant="ghost" size="sm">
								View
							</Button>
						</Link>
						<Link to={`/groups/${group.id}/settings`}>
							<Button variant="ghost" size="sm">
								<Settings className="mr-1 h-4 w-4" />
								Settings
							</Button>
						</Link>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
