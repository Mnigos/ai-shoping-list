import { Calendar, ShoppingCart, Users } from 'lucide-react'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '~/shared/components/ui/card'
import type { InviteCodeValidationResult } from '../server/group-invite.service'

interface GroupPreviewProps {
	groupInfo: InviteCodeValidationResult
	className?: string
}

export function GroupPreview({ groupInfo, className }: GroupPreviewProps) {
	const formatDate = (date: Date) => {
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		}).format(date)
	}

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Users className="h-5 w-5" />
					{groupInfo.name}
				</CardTitle>
				{groupInfo.description && (
					<p className="text-muted-foreground text-sm">
						{groupInfo.description}
					</p>
				)}
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-2 gap-4 text-sm">
					<div className="flex items-center gap-2">
						<Users className="h-4 w-4 text-muted-foreground" />
						<span>
							{groupInfo.memberCount} member
							{groupInfo.memberCount !== 1 ? 's' : ''}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<ShoppingCart className="h-4 w-4 text-muted-foreground" />
						<span>
							{groupInfo.itemCount} item{groupInfo.itemCount !== 1 ? 's' : ''}
						</span>
					</div>
				</div>
				<div className="flex items-center gap-2 text-muted-foreground text-sm">
					<Calendar className="h-4 w-4" />
					<span>Created {formatDate(groupInfo.createdAt)}</span>
				</div>
			</CardContent>
		</Card>
	)
}
