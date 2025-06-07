import { Button } from '~/shared/components/ui/button'
import { GroupCreationFlow } from './group-creation-flow'

export function GroupCreationDemo() {
	return (
		<div className="space-y-4 p-8">
			<h2 className="font-bold text-2xl">Group Creation Flow Demo</h2>
			<p className="text-muted-foreground">
				This demonstrates Task 7: Group Creation with Transfer Modal
			</p>

			<GroupCreationFlow
				onComplete={() => {
					console.log('Group creation flow completed!')
				}}
			>
				<Button>Create New Group</Button>
			</GroupCreationFlow>

			<div className="mt-8 rounded-lg bg-muted p-4">
				<h3 className="mb-2 font-semibold">What this demonstrates:</h3>
				<ul className="list-inside list-disc space-y-1 text-sm">
					<li>✅ Create Group Dialog with form validation</li>
					<li>✅ Transfer List Modal (shows when user has existing items)</li>
					<li>✅ Group creation mutation with optimistic updates</li>
					<li>✅ Transfer shopping list mutation</li>
					<li>✅ Proper error handling and loading states</li>
				</ul>

				<p className="mt-4 text-muted-foreground text-sm">
					<strong>Note:</strong> The transfer modal will only show if you have
					existing shopping list items. The shopping list integration (Task 10)
					needs to be completed for full functionality.
				</p>
			</div>
		</div>
	)
}
