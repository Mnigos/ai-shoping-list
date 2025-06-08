import { JoinGroupPage } from '~/modules/group/components/join-group-page'
import type { Route } from './+types/invite.$code.route'

export default function InviteRoute({
	params: { code },
}: Route.ComponentProps) {
	return <JoinGroupPage code={code} />
}
