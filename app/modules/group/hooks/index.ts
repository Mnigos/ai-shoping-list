// Query hooks
export { useGroups, useGroupsData } from './use-groups'
export { useActiveGroup, useActiveGroupData } from './use-active-group'
export { useValidateInviteCodeQuery } from './use-join-group-mutation'
export {
	useValidateInviteTokenQuery,
	useJoinViaTokenMutation,
} from './use-join-group-token'
export { useGroupMembers } from './use-member-management'

// Mutation hooks
export { useCreateGroupMutation } from './use-create-group.mutation'
export { useUpdateGroupMutation } from './use-update-group-mutation'
export { useDeleteGroupMutation } from './use-delete-group.mutation'
export { useJoinGroupMutation } from './use-join-group-mutation'
export { useGenerateInviteCodeMutation } from './use-generate-invite-code-mutation'
export { useTransferListMutation } from './use-transfer-list-mutation'
export {
	useRemoveMemberMutation,
	useUpdateRoleMutation,
	useLeaveGroupMutation,
} from './use-member-management'

// Helper types and functions
export type { GroupWithRole } from './helpers/group-optimistic-updates'
export {
	hasOnlyPersonalGroup,
	isGroupAdmin,
	getPersonalGroup,
	getCollaborativeGroups,
	canCreateGroups,
	getDefaultActiveGroupId,
	findGroupById,
	isValidGroupId,
} from './helpers/group-helpers'
