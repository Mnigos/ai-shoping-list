import { Check, ChevronDown, Users } from 'lucide-react'
import { Button } from '~/shared/components/ui/button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '~/shared/components/ui/popover'
import { cn } from '~/shared/utils/cn'
import { useActiveGroupData } from '../hooks/use-active-group'

interface GroupSelectorProps {
	className?: string
}

export function GroupSelector({ className }: GroupSelectorProps) {
	const { activeGroup, availableGroups, setActiveGroup, isLoading } =
		useActiveGroupData()

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

	if (availableGroups.length <= 1) {
		return null
	}

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
				<PopoverContent className="w-[200px] p-0">
					<div className="max-h-[300px] overflow-auto">
						{availableGroups.map(group => (
							<button
								key={group.id}
								type="button"
								className={cn(
									'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
									activeGroup?.id === group.id &&
										'bg-accent text-accent-foreground',
								)}
								onClick={() => setActiveGroup(group.id)}
							>
								<div className="flex items-center gap-2">
									<Users className="h-4 w-4" />
									<div className="flex flex-col items-start">
										<span className="truncate font-medium">{group.name}</span>
										{group.isPersonal && (
											<span className="text-muted-foreground text-xs">
												Personal
											</span>
										)}
									</div>
								</div>
								{activeGroup?.id === group.id && (
									<Check className="ml-auto h-4 w-4" />
								)}
							</button>
						))}
					</div>
				</PopoverContent>
			</Popover>
		</div>
	)
}
