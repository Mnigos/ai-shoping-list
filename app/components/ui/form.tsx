import { Slot } from '@radix-ui/react-slot'
import {
	createFormHook,
	createFormHookContexts,
	useStore,
} from '@tanstack/react-form'
import { type ComponentProps, createContext, use, useId } from 'react'
import { Label } from '~/components/ui/label'
import { cn } from '~/utils/cn'

const {
	fieldContext,
	formContext,
	useFieldContext: useFormFieldContext,
	useFormContext,
} = createFormHookContexts()

const { useAppForm, withForm } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: {
		FormLabel,
		FormControl,
		FormDescription,
		FormMessage,
		FormItem,
	},
	formComponents: {},
})

interface FormItemContextValue {
	id: string
}

const FormItemContext = createContext<FormItemContextValue>(
	{} as FormItemContextValue,
)

export function FormItem({
	className,
	...props
}: Readonly<ComponentProps<'div'>>) {
	const id = useId()

	return (
		<FormItemContext.Provider value={{ id }}>
			<div
				data-slot="form-item"
				className={cn('grid gap-2', className)}
				{...props}
			/>
		</FormItemContext.Provider>
	)
}

export function useFieldContext() {
	const { id } = use(FormItemContext)
	const { name, store, ...fieldContext } = useFormFieldContext()

	if (!fieldContext)
		throw new Error('useFieldContext should be used within <FormItem>')

	const errors = useStore(store, state => state.meta.errors)

	return {
		id,
		name,
		formItemId: `${id}-form-item`,
		formDescriptionId: `${id}-form-item-description`,
		formMessageId: `${id}-form-item-message`,
		errors,
		store,
		...fieldContext,
	}
}

export function FormLabel({
	className,
	...props
}: Readonly<ComponentProps<typeof Label>>) {
	const { formItemId, errors } = useFieldContext()

	return (
		<Label
			data-slot="form-label"
			data-error={!!errors.length}
			className={cn('data-[error=true]:text-destructive', className)}
			htmlFor={formItemId}
			{...props}
		/>
	)
}

export function FormControl({
	...props
}: Readonly<ComponentProps<typeof Slot>>) {
	const { errors, formItemId, formDescriptionId, formMessageId } =
		useFieldContext()

	return (
		<Slot
			data-slot="form-control"
			id={formItemId}
			aria-describedby={
				!errors.length
					? `${formDescriptionId}`
					: `${formDescriptionId} ${formMessageId}`
			}
			aria-invalid={!!errors.length}
			{...props}
		/>
	)
}

export function FormDescription({
	className,
	...props
}: Readonly<ComponentProps<'p'>>) {
	const { formDescriptionId } = useFieldContext()

	return (
		<p
			data-slot="form-description"
			id={formDescriptionId}
			className={cn('text-muted-foreground text-sm', className)}
			{...props}
		/>
	)
}

export function Message({
	className,
	...props
}: Readonly<ComponentProps<'p'>>) {
	return (
		<p
			className={cn('min-h-5 text-destructive text-sm', className)}
			{...props}
		/>
	)
}

export function FormMessage({
	className,
	children,
	...props
}: Readonly<ComponentProps<'p'>>) {
	const { errors, formMessageId } = useFieldContext()
	const body = errors.length ? String(errors.at(0)?.message ?? '') : children

	return (
		<Message data-slot="form-message" id={formMessageId} {...props}>
			{body}
		</Message>
	)
}

export { useAppForm, useFormContext, withForm }
