import { useParams } from 'react-router'

export function useGroupIdParam() {
	const { id } = useParams()

	if (!id) throw new Error('Group ID is required')

	return id
}
