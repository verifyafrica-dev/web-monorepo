import { FloppyDiskIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";
import { toast } from "sonner";
import { useUpdateMeV2Mutation } from "#/api/http/v2/users/users.hooks";
import {
	UserProfileUpdateFormSchema,
	type UserProfileUpdateFormValues,
	type UserSession,
} from "#/api/http/v2/users/users.types";
import { Avatar, AvatarFallback, AvatarImage } from "@verifyafrica/ui/components/ui/avatar";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { cn } from "#/lib/utils.ts";
import { getUserInitials } from "#/lib/user";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";

export function UpdateProfileTab({ user }: { user: UserSession }) {
	const updateMeMutation = useUpdateMeV2Mutation();

	const form = useForm({
		defaultValues: {
			first_name: user.first_name ?? "",
			last_name: user.last_name ?? "",
			phone_number: user.phone_number ?? "",
		} satisfies UserProfileUpdateFormValues,
		validators: {
			onSubmit: UserProfileUpdateFormSchema,
		},
		onSubmit: async ({ value }) => {
			await updateMeMutation.mutateAsync(
				{
					first_name: value.first_name,
					last_name: value.last_name,
					phone_number: value.phone_number || undefined,
				},
				{
					onSuccess: () => {
						toast.success("Profile updated successfully");
					},
					onError: () => {
						toast.error("Failed to update profile. Please try again.");
					},
				},
			);
		},
	});

	useEffect(() => {
		form.reset({
			first_name: user.first_name ?? "",
			last_name: user.last_name ?? "",
			phone_number: user.phone_number ?? "",
		});
	}, [form, user.first_name, user.last_name, user.phone_number]);

	return (
		<form
			className="flex flex-col gap-6"
			onSubmit={(event) => {
				event.preventDefault();
				form.handleSubmit();
			}}
		>
			<div className="flex flex-col items-center gap-2 text-center">
				<Avatar className="size-24">
					{user.avatar_url ? (
						<AvatarImage
							src={user.avatar_url}
							alt="Profile avatar"
						/>
					) : null}
					<AvatarFallback className="bg-muted text-lg text-muted-foreground">
						{getUserInitials(
							[user.first_name, user.last_name]
								.filter(Boolean)
								.join(" ")
								.trim() || user.email,
						)}
					</AvatarFallback>
				</Avatar>
			</div>

			<FieldGroup className="grid gap-4 sm:grid-cols-2">
				<form.Field name="first_name">
					{(field) => (
						<Field className="flex flex-col gap-1.5">
							<FieldLabel htmlFor="first-name">First Name</FieldLabel>
							<Input
								id="first-name"
								placeholder="Enter your first name"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								aria-invalid={field.state.meta.errors.length > 0}
							/>
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				</form.Field>

				<form.Field name="last_name">
					{(field) => (
						<Field className="flex flex-col gap-1.5">
							<FieldLabel htmlFor="last-name">Last Name</FieldLabel>
							<Input
								id="last-name"
								placeholder="Enter your last name"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								aria-invalid={field.state.meta.errors.length > 0}
							/>
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				</form.Field>

				<Field className="flex flex-col gap-2">
					<FieldLabel htmlFor="email">Email Address</FieldLabel>
					<Input
						id="email"
						type="email"
						value={user.email}
						disabled
					/>
				</Field>
			</FieldGroup>

			<Button
				type="submit"
				className="w-full"
				disabled={updateMeMutation.isPending}
			>
				<FloppyDiskIcon
					className={cn(
						"size-4",
						updateMeMutation.isPending && "animate-pulse",
					)}
					weight="fill"
				/>
				{updateMeMutation.isPending ? "Updating Profile..." : "Update Profile"}
			</Button>
		</form>
	);
}

