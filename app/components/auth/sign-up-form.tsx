'use client'

import { LoaderCircle } from 'lucide-react'
import { type FormEvent, useState, useTransition } from 'react'
import { z } from 'zod'
import { authClient } from '~/lib/auth-client'
import { Button } from '../ui/button'
import { Message, useAppForm } from '../ui/form'
import { Input } from '../ui/input'

const passwordSchema = z
	.string()
	.min(8, { message: 'Password must be at least 8 characters long' })
	.max(20, { message: 'Password must be less than 20 characters' })
	.refine(password => /[A-Z]/.test(password), {
		message: 'Password must contain at least one uppercase letter',
	})
	.refine(password => /[a-z]/.test(password), {
		message: 'Password must contain at least one lowercase letter',
	})
	.refine(password => /[0-9]/.test(password), {
		message: 'Password must contain at least one number',
	})
	.refine(password => /[!@#$%^&*]/.test(password), {
		message: 'Password must contain at least one special character',
	})

interface SignUpFormProps {
	onSuccess?: () => void
}

export function SignUpForm({ onSuccess }: Readonly<SignUpFormProps>) {
	const [isLoading, startTransition] = useTransition()
	const [error, setError] = useState<string>('')
	const form = useAppForm({
		defaultValues: {
			name: '',
			email: '',
			password: '',
		},
		onSubmit: async ({ value: { name, email, password } }) => {
			await authClient.signUp.email(
				{
					name,
					email,
					password,
					callbackURL: '/',
				},
				{
					onSuccess: () => {
						onSuccess?.()
					},
					onError: ({ error }) => {
						setError(error.message)
					},
				},
			)
		},
	})

	function handleSubmit(event: FormEvent) {
		event.preventDefault()
		event.stopPropagation()
		startTransition(() => {
			form.handleSubmit()
		})
	}

	return (
		<form.AppForm>
			<form onSubmit={handleSubmit} className="flex w-80 flex-col gap-0.5">
				<form.AppField
					name="name"
					validators={{
						onBlur: z
							.string()
							.min(3, { message: 'Name must be at least 3 characters long' }),
					}}
				>
					{field => (
						<field.FormItem>
							<field.FormLabel>Name</field.FormLabel>
							<field.FormControl>
								<Input
									type="text"
									value={field.state.value}
									onChange={({ target }) => field.handleChange(target.value)}
									onBlur={field.handleBlur}
								/>
							</field.FormControl>
							<field.FormMessage />
						</field.FormItem>
					)}
				</form.AppField>

				<form.AppField
					name="email"
					validators={{
						onBlur: z.string().email({ message: 'Invalid email address' }),
					}}
				>
					{field => (
						<field.FormItem>
							<field.FormLabel>Email</field.FormLabel>
							<field.FormControl>
								<Input
									type="email"
									value={field.state.value}
									onChange={({ target }) => field.handleChange(target.value)}
									onBlur={field.handleBlur}
								/>
							</field.FormControl>
							<field.FormMessage />
						</field.FormItem>
					)}
				</form.AppField>

				<form.AppField
					name="password"
					validators={{
						onBlur: passwordSchema,
					}}
				>
					{field => (
						<field.FormItem>
							<field.FormLabel>Password</field.FormLabel>
							<field.FormControl>
								<Input
									type="password"
									value={field.state.value}
									onChange={({ target }) => field.handleChange(target.value)}
									onBlur={field.handleBlur}
								/>
							</field.FormControl>
							<field.FormMessage />
						</field.FormItem>
					)}
				</form.AppField>

				<Button type="submit" className="mt-2" disabled={isLoading}>
					{isLoading ? (
						<>
							<LoaderCircle className="animate-spin" />
							Signing up...
						</>
					) : (
						'Sign Up'
					)}
				</Button>

				<Message className="mt-2">{error}</Message>
			</form>
		</form.AppForm>
	)
}
