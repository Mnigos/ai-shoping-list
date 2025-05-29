'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { type FormEvent, useEffect, useRef, useTransition } from 'react'
import { useTRPC } from '~/lib/trpc/react'
import { type Message, useChatStore } from '~/stores/chat.store'
import { cn } from '~/utils/cn'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'

interface ChatProps {
	className?: string
}

export function Chat({ className }: Readonly<ChatProps>) {
	const formRef = useRef<HTMLFormElement>(null)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const messagesContainerRef = useRef<HTMLDivElement>(null)
	const prevMessagesLengthRef = useRef(0)
	const messages = useChatStore(state => state.messages)
	const addMessage = useChatStore(state => state.addMessage)
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const [isLoading, startTransition] = useTransition()

	const { mutateAsync: addToShoppingList } = useMutation(
		trpc.assistant.addToShoppingList.mutationOptions(),
	)

	const { mutateAsync: executeShoppingListActions } = useMutation({
		...trpc.shoppingList.executeActions.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.shoppingList.getItems.queryKey(),
			})
		},
	})

	useEffect(() => {
		if (messages.length > 0 && prevMessagesLengthRef.current === 0) {
			prevMessagesLengthRef.current = messages.length

			if (messagesContainerRef.current)
				messagesContainerRef.current.scrollTop =
					messagesContainerRef.current.scrollHeight
		}
	}, [messages.length])

	useEffect(() => {
		if (messages.length > prevMessagesLengthRef.current) {
			messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
			prevMessagesLengthRef.current = messages.length
		}
	}, [messages.length])

	function handleSubmit(event: FormEvent) {
		event.preventDefault()

		const formData = new FormData(event.target as HTMLFormElement)
		const prompt = formData.get('prompt') as string

		// 1. Add user message to chat store
		addMessage({
			id: crypto.randomUUID(),
			content: prompt.trim(),
			role: 'user',
			createdAt: new Date(),
		})

		formRef.current?.reset()

		startTransition(async () => {
			try {
				// 2. Get actions from assistant (no currentItems needed)
				const result = await addToShoppingList({ prompt })

				// 3. Collect actions and assistant message
				const allActions: Array<{
					action: 'add' | 'update' | 'delete' | 'complete'
					name: string
					amount?: number
				}> = []
				let assistantMessage = ''

				for await (const chunk of result) {
					if (chunk?.actions && Array.isArray(chunk.actions)) {
						for (const action of chunk.actions) {
							if (action?.action && action?.name) {
								allActions.push({
									action: action.action,
									name: action.name,
									amount: action.amount,
								})
							}
						}
					}
					if (chunk?.message) {
						assistantMessage = chunk.message
					}
				}

				// 4. Add assistant message to chat store
				if (assistantMessage) {
					addMessage({
						id: crypto.randomUUID(),
						content: assistantMessage,
						role: 'assistant',
						createdAt: new Date(),
					})
				}

				// 5. Execute shopping list actions in database
				if (allActions.length > 0) {
					await executeShoppingListActions({ actions: allActions })
				}
			} catch (error) {
				console.error('Error processing chat message:', error)

				// Add error message to chat
				addMessage({
					id: crypto.randomUUID(),
					content:
						'Sorry, I encountered an error processing your request. Please try again.',
					role: 'assistant',
					createdAt: new Date(),
				})
			}
		})
	}

	return (
		<section className={cn('flex flex-col gap-8', className)}>
			<header>
				<h2 className="font-bold text-3xl">Chat</h2>
			</header>

			<div className="flex flex-col gap-4">
				<div
					ref={messagesContainerRef}
					className="flex max-h-96 flex-col gap-3 overflow-y-auto"
				>
					{messages.map(message => (
						<ChatMessage key={message.id} message={message} />
					))}
					<div ref={messagesEndRef} />
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

					<Button type="submit" className="self-end">
						{isLoading ? (
							<>
								<Loader2 className="animate-spin" /> Sending...
							</>
						) : (
							'Send'
						)}
					</Button>
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
