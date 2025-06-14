import { customAlphabet } from 'nanoid'
import type { ProtectedContext } from '~/lib/trpc/t'

// Implement verifying before joining and show user group preview
export class GroupInviteService {
	constructor(private readonly ctx: ProtectedContext) {}

	/*
	 * !!! This needs to be refactored
	 * Should be saved to KV storage
	 * Should be able to expire
	 */
	generateInviteCode() {
		const generateToken = customAlphabet(
			'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
			6,
		)

		return generateToken()
	}
}
