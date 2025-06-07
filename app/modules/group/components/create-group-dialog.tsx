import { useState } from 'react'
import { Button } from '~/shared/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '~/shared/components/ui/dialog'
import { Input } from '~/shared/components/ui/input'
import { Label } from '~/shared/components/ui/label'
import { Textarea } from '~/shared/components/ui/textarea'
import { useCreateGroupMutation } from '../hooks/use-create-group-mutation'
import type { CreateGroupInput } from '../server/group.service'

interface CreateGroupDialogProps {
	children: React.ReactNode
	onGroupCreated?: (group: { id: string; name: string }) => void
}

export function CreateGroupDialog({
	children,
	onGroupCreated,
}: CreateGroupDialogProps) {
	const [open, setOpen] = useState(false)
	const [formData, setFormData] = useState<CreateGroupInput>({
		name: '',
		description: '',
	})

	const createGroupMutation = useCreateGroupMutation()

	function handleSubmit(event: React.FormEvent) {
		event.preventDefault()

		if (!formData.name.trim()) return

		createGroupMutation.mutate(formData, {
			onSuccess: group => {
				setOpen(false)
				setFormData({ name: '', description: '' })
				onGroupCreated?.(group)
			},
		})
	}

	function handleInputChange(field: keyof CreateGroupInput, value: string) {
		setFormData(prev => ({ ...prev, [field]: value }))
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create New Group</DialogTitle>
					<DialogDescription>
						Create a group to share shopping lists with family and friends.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="group-name">Group Name</Label>
						<Input
							id="group-name"
							type="text"
							placeholder="e.g., Family, Roommates, Work Team"
							value={formData.name}
							onChange={e => handleInputChange('name', e.target.value)}
							required
							maxLength={50}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="group-description">Description (Optional)</Label>
						<Textarea
							id="group-description"
							placeholder="What's this group for?"
							value={formData.description || ''}
							onChange={e => handleInputChange('description', e.target.value)}
							maxLength={200}
							rows={3}
						/>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={createGroupMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={createGroupMutation.isPending || !formData.name.trim()}
						>
							{createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
