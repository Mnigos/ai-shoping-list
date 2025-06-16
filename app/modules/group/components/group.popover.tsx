import { Check, ChevronDown, Plus, UserPlus, Users } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'
import { Button } from '~/shared/components/ui/button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '~/shared/components/ui/popover'
import { cn } from '~/shared/utils/cn'
import { useMyGroupsQuery } from '../hooks/queries/use-my-groups.query'
import { CreateGroupDialog } from './create-group.modal'
import { JoinGroupDialog } from './join-group.modal'

interface GroupSelectorProps {
	className?: string
}

export function GroupSelector({ className }: GroupSelectorProps) {
	const { data: myGroups, isLoading } = useMyGroupsQuery()
	const { id } = useParams()
	const navigate = useNavigate()

	if (isLoading) {
		return (
			<div className={cn('flex items-center gap-2', className)}>
				<div
					className="h-9 w-32 animate-pulse rounded-md bg-muted"
					data-testid="group-selector-loading"
				/>
			</div>
		)
	}

	if (!myGroups || myGroups.length <= 1) {
		return null
	}

	const activeGroup = myGroups.find(group => group.id === id)

	return (
		<div className={cn('flex items-center gap-2', className)}>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className="w-[200px] justify-between"
						aria-expanded="false"
						aria-haspopup="listbox"
					>
						<div className="flex items-center gap-2">
							<Users className="h-4 w-4" />
							<span className="truncate">
								{activeGroup?.name || 'Select group...'}
							</span>
						</div>
						<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>

				<PopoverContent className="p-1">
					<div className="flex max-h-[300px] flex-col overflow-auto">
						<CreateGroupDialog>
							<Button variant="ghost" className="justify-start">
								<Plus className="h-4 w-4" />
								Create Group
							</Button>
						</CreateGroupDialog>

						<JoinGroupDialog>
							<Button variant="ghost" className="justify-start">
								<UserPlus className="h-4 w-4" />
								Join Group
							</Button>
						</JoinGroupDialog>

						{myGroups.map(group => (
							<Button
								key={group.id}
								className={cn(
									'justify-start px-3',
									activeGroup?.id === group.id &&
										'bg-accent text-accent-foreground',
								)}
								variant="ghost"
								onClick={() => navigate(`/groups/${group.id}`)}
							>
								<div className="flex items-center gap-2">
									<Users className="h-4 w-4" />
									{group.name}
								</div>
								{activeGroup?.id === group.id && (
									<Check className="ml-auto h-4 w-4" />
								)}
							</Button>
						))}
					</div>
				</PopoverContent>
			</Popover>
		</div>
	)
}
