import { useQuery } from '@tanstack/react-query'
import { Chat } from '~/components/chat'
import { ShoppingList } from '~/components/shopping-list'
import { useTRPC } from '~/lib/trpc/react'

export function meta() {
	return [
		{ title: 'New React Router App' },
		{ name: 'description', content: 'Welcome to React Router!' },
	]
}

export default function Home() {
	const trpc = useTRPC()
	const { data } = useQuery(trpc.assistant.hello.queryOptions())
	console.log(data)

	return (
		<main className="container mx-auto grid grid-cols-2 gap-8 p-4">
			<ShoppingList />
			<Chat />
		</main>
	)
}
