import { Calendar, Users } from 'lucide-react'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '~/shared/components/ui/card'
import type { Group, ValidateInviteCodeOutput } from '../server/schemas'

const formatDate = (date: Date) =>
	new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	}).format(date)

interface GroupPreviewCardProps {
	group: Group | ValidateInviteCodeOutput['group']
	className?: string
}

export function GroupPreviewCard({
	group: { name, description, membersCount, createdAt },
	className,
}: Readonly<GroupPreviewCardProps>) {
	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Users className="h-5 w-5" />
					{name}
				</CardTitle>
				{description && (
					<p className="text-muted-foreground text-sm">{description}</p>
				)}
			</CardHeader>

			<CardContent className="space-y-4">
				<div className="grid grid-cols-2 gap-4 text-sm">
					<div className="flex items-center gap-2">
						<Users className="h-4 w-4 text-muted-foreground" />
						<span>
							{membersCount} member
							{membersCount !== 1 ? 's' : ''}
						</span>
					</div>
				</div>

				<div className="flex items-center gap-2 text-muted-foreground text-sm">
					<Calendar className="h-4 w-4" />
					<span>Created {formatDate(createdAt)}</span>
				</div>
			</CardContent>
		</Card>
	)
}
