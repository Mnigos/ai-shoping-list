'use client'

import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { type FormEvent, useRef, useTransition } from 'react'
import { useTRPC } from '~/lib/trpc/react'
import { useChatStore } from '~/stores/chat.store'
import { useShoppingListStore } from '~/stores/shopping-list.store'
import { cn } from '~/utils/cn'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'

interface Message {
	id: string
	content: string
	role: 'user' | 'assistant'
	createdAt: Date
}

interface ChatProps {
	className?: string
}

export function Chat({ className }: Readonly<ChatProps>) {
	const formRef = useRef<HTMLFormElement>(null)
	const messages = useChatStore(state => state.messages)
	const addMessage = useChatStore(state => state.addMessage)
	const addItem = useShoppingListStore(state => state.addItem)
	const trpc = useTRPC()
	const [isLoading, startTransition] = useTransition()

	const { mutateAsync: addToShoppingList } = useMutation(
		trpc.assistant.addToShoppingList.mutationOptions(),
	)

	function handleSubmit(event: FormEvent) {
		event.preventDefault()

		const formData = new FormData(event.target as HTMLFormElement)
		const prompt = formData.get('prompt') as string

		addMessage({
			id: crypto.randomUUID(),
			content: prompt.trim(),
			role: 'user',
			createdAt: new Date(),
		})

		formRef.current?.reset()

		startTransition(async () => {
			const { message, name, amount } = await addToShoppingList({ prompt })

			addMessage({
				id: crypto.randomUUID(),
				content: message,
				role: 'assistant',
				createdAt: new Date(),
			})

			addItem({ name, amount })
		})
	}

	return (
		<section className={cn('flex flex-col gap-8', className)}>
			<header>
				<h2 className="font-bold text-3xl">Chat</h2>
			</header>

			<div className="flex flex-col gap-4">
				<div className="flex max-h-96 flex-col gap-3 overflow-y-auto">
					{messages.map(message => (
						<ChatMessage key={message.id} message={message} />
					))}
				</div>

				<form
					ref={formRef}
					className="flex flex-col gap-2"
					onSubmit={handleSubmit}
				>
					<Textarea
						placeholder="Send a message"
						name="prompt"
						rows={3}
						onKeyDown={e => {
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault()
								formRef.current?.requestSubmit()
							}
						}}
					/>

					<div className="flex justify-end">
						<Button type="submit">
							{isLoading ? (
								<>
									<Loader2 className="animate-spin" /> Sending...
								</>
							) : (
								'Send'
							)}
						</Button>
					</div>
				</form>
			</div>
		</section>
	)
}

interface ChatMessageProps {
	message: Message
}

function ChatMessage({ message }: Readonly<ChatMessageProps>) {
	const isAssistant = message.role === 'assistant'

	return (
		<div className={cn('flex', isAssistant ? 'justify-start' : 'justify-end')}>
			<div
				className={cn(
					'max-w-[80%] rounded-lg px-4 py-2 text-sm',
					isAssistant
						? 'bg-muted text-muted-foreground'
						: 'bg-primary text-primary-foreground',
				)}
			>
				<p className="whitespace-pre-wrap">{message.content}</p>
				<time
					className={cn(
						'mt-1 block text-xs opacity-70',
						isAssistant ? 'text-muted-foreground' : 'text-primary-foreground',
					)}
				>
					{message.createdAt.toLocaleTimeString([], {
						hour: '2-digit',
						minute: '2-digit',
					})}
				</time>
			</div>
		</div>
	)
}
