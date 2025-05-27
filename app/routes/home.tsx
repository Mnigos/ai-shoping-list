import { Chat } from '~/components/chat'
import { ShoppingList } from '~/components/shopping-list'

export function meta() {
	return [
		{ title: 'New React Router App' },
		{ name: 'description', content: 'Welcome to React Router!' },
	]
}

export default function Home() {
	return (
		<main className="container mx-auto grid grid-cols-2 gap-8 p-4">
			<ShoppingList />
			<Chat />
		</main>
	)
}
