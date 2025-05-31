'use client'

import { LoaderCircle } from 'lucide-react'
import { type FormEvent, useState, useTransition } from 'react'
import { z } from 'zod'
import { GoogleIcon } from '~/assets/icons'
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
	const [isGoogleLoading, startGoogleTransition] = useTransition()
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

	function handleGoogleSignIn() {
		setError('')
		startGoogleTransition(async () => {
			await authClient.signIn.social(
				{
					provider: 'google',
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
		})
	}

	return (
		<form.AppForm>
			<div className="flex w-80 flex-col gap-4">
				<Button
					type="button"
					variant="outline"
					onClick={handleGoogleSignIn}
					disabled={isGoogleLoading || isLoading}
					className="w-full"
				>
					{isGoogleLoading ? (
						<>
							<LoaderCircle className="animate-spin" />
							Signing in...
						</>
					) : (
						<>
							<GoogleIcon className="h-4 w-4" />
							Sign up with Google
						</>
					)}
				</Button>

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

					<Button
						type="submit"
						className="mt-2"
						disabled={isLoading || isGoogleLoading}
					>
						{isLoading ? (
							<>
								<LoaderCircle className="animate-spin" />
								Signing up...
							</>
						) : (
							'Sign Up'
						)}
					</Button>
				</form>

				<Message className="mt-2">{error}</Message>
			</div>
		</form.AppForm>
	)
}
