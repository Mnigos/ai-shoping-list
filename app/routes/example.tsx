import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '~/lib/trpc/react'

export default function Example() {
	const trpc = useTRPC()
	const { data } = useQuery(trpc.assistant.hello.queryOptions())
	console.log('data', data)

	return <div>{data ?? 'loading...'}</div>
}
