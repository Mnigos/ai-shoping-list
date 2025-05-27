'use client'

import type { ComponentProps, PropsWithChildren } from 'react'
import { useState } from 'react'
import { cn } from '~/utils/cn'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'

interface Message {
	id: string
	content: string
	role: 'user' | 'assistant'
	timestamp: Date
}

interface ChatProps {
	className?: string
}

export function Chat({ className }: Readonly<ChatProps>) {
	const [messages, setMessages] = useState<Message[]>([
		{
			id: '1',
			content:
				"Hi! I'm here to help you manage your shopping list. What would you like to add to your shopping list today?",
			role: 'assistant',
			timestamp: new Date(),
		},
	])
	const [inputValue, setInputValue] = useState('')

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

				<form className="flex flex-col gap-2">
					<Textarea
						placeholder="Send a message"
						value={inputValue}
						onChange={e => setInputValue(e.target.value)}
						rows={3}
					/>

					<div className="flex justify-end">
						<Button disabled={!inputValue.trim()}>Send</Button>
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
					{message.timestamp.toLocaleTimeString([], {
						hour: '2-digit',
						minute: '2-digit',
					})}
				</time>
			</div>
		</div>
	)
}
