import { ShoppingList } from '~/components/shopping-list'

export function meta() {
	return [
		{ title: 'New React Router App' },
		{ name: 'description', content: 'Welcome to React Router!' },
	]
}

export default function Home() {
	return (
		<main className="container mx-auto p-4">
			<ShoppingList />
		</main>
	)
}
