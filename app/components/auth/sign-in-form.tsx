'use client'

import { LoaderCircle } from 'lucide-react'
import { useState, useTransition } from 'react'
import { z } from 'zod'
import { authClient } from '~/lib/auth-client'
import { Button } from '../ui/button'
import { Message, useAppForm } from '../ui/form'
import { Input } from '../ui/input'
import { ContinueWithGoogleButton } from './continue-with-google-button'

interface SignInFormProps {
	onSuccess?: () => void
}

export function SignInForm({ onSuccess }: Readonly<SignInFormProps>) {
	const [isLoading, startTransition] = useTransition()
	const [error, setError] = useState<string>('')
	const form = useAppForm({
		defaultValues: {
			email: '',
			password: '',
		},
		onSubmit: async ({ value: { email, password } }) => {
			await authClient.signIn.email(
				{
					email,
					password,
					callbackURL: '/',
				},
				{
					onSuccess: () => {
						onSuccess?.()
						window.location.reload()
					},
					onError: ({ error }) => {
						setError(error.message)
					},
				},
			)
		},
	})

	function handleSubmit(event: React.FormEvent) {
		event.preventDefault()
		event.stopPropagation()
		startTransition(async () => {
			await form.handleSubmit()
		})
	}

	return (
		<form.AppForm>
			<div className="flex w-80 flex-col gap-4">
				<ContinueWithGoogleButton setError={setError} onSuccess={onSuccess} />

				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-background px-2 text-muted-foreground">
							Or continue with
						</span>
					</div>
				</div>

				<form onSubmit={handleSubmit} className="flex flex-col gap-0.5">
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
							onBlur: z.string().min(1, { message: 'Password is required' }),
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

					<Button type="submit" disabled={isLoading} className="mt-2">
						{isLoading ? (
							<>
								<LoaderCircle className="animate-spin" />
								Signing in...
							</>
						) : (
							'Sign In'
						)}
					</Button>
				</form>

				<Message className="mt-2">{error}</Message>
			</div>
		</form.AppForm>
	)
}
