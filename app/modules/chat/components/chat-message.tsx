import type { Message } from '~/modules/chat/stores/chat.store'
import { cn } from '~/shared/utils/cn'

interface ChatMessageProps {
	message: Message
}

export function ChatMessage({ message }: Readonly<ChatMessageProps>) {
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
				{message.createdAt && (
					<time
						dateTime={message.createdAt.toISOString()}
						className={cn(
							'mt-1 block text-xs opacity-70',
							isAssistant ? 'text-muted-foreground' : 'text-primary-foreground',
						)}
						aria-label={`Message sent at ${message.createdAt.toLocaleTimeString()}`}
					>
						{message.createdAt.toLocaleTimeString([], {
							hour: '2-digit',
							minute: '2-digit',
						})}
					</time>
				)}
			</div>
		</div>
	)
}
