import { useForm } from "@tanstack/react-form";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { getV2ErrorMessage } from "@verifyafrica/api-client/http/shared";
import { useSendCustomMessageV2Mutation } from "#/api/http/v2/mail/mail.hooks";
import { USERS_V2_API } from "#/api/http/v2/users/users.api";
import type { AdminUser } from "#/api/http/v2/users/users.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@verifyafrica/ui/components/ui/dialog";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@verifyafrica/ui/components/ui/radio-group";
import {
	AsyncCombobox,
	type AsyncComboboxOption,
} from "#/components/ui-extended/combobox-async";
import { RichTextEditor } from "#/components/ui-extended/rich-text-editor";
import { isRichTextEmpty } from "#/lib/rich-text";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";

type AudienceMode = "all_users" | "selected_users";

type SendMessageFormValues = {
	subject: string;
	message: string;
	audience: AudienceMode;
};

const SendMessageFormSchema = z.object({
	subject: z.string().trim().min(1, "Subject is required").max(200),
	message: z
		.string()
		.refine((value) => !isRichTextEmpty(value), "Message is required"),
	audience: z.enum(["all_users", "selected_users"]),
});

function userToOption(user: AdminUser): AsyncComboboxOption {
	const fullName = [user.first_name, user.last_name]
		.filter(Boolean)
		.join(" ")
		.trim();
	const businessName = user.tenants?.[0]?.name;
	return {
		value: user.email,
		label: fullName || user.email,
		description: [user.email, businessName].filter(Boolean).join(" · "),
	};
}

export function SendMessageDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const sendMessageMutation = useSendCustomMessageV2Mutation();
	const isSubmitting = sendMessageMutation.isPending;
	const [selectedUsers, setSelectedUsers] = useState<AsyncComboboxOption[]>([]);
	const [recipientError, setRecipientError] = useState<string | null>(null);

	const defaultValues: SendMessageFormValues = {
		subject: "",
		message: "",
		audience: "selected_users",
	};

	const searchUsers = useCallback(async (query: string, page: number) => {
		const result = await USERS_V2_API.LIST({
			page,
			per_page: 20,
			search: query || undefined,
			sort_by: "recently_created",
		});
		const pagination = result.meta.pagination;
		return {
			items: result.items.map(userToOption),
			hasMore: pagination.current_page < pagination.total_pages,
		};
	}, []);

	const form = useForm({
		defaultValues,
		validators: {
			onSubmit: SendMessageFormSchema,
		},
		onSubmit: async ({ value }) => {
			if (value.audience === "selected_users" && selectedUsers.length === 0) {
				setRecipientError("Select at least one recipient");
				return;
			}
			setRecipientError(null);

			try {
				const result = await sendMessageMutation.mutateAsync({
					subject: value.subject.trim(),
					message: value.message,
					audience: value.audience,
					recipient_emails:
						value.audience === "selected_users"
							? selectedUsers.map((user) => user.value)
							: [],
				});
				toast.success(
					`Message queued for ${result.queued_count} recipient${result.queued_count === 1 ? "" : "s"} (${result.batch_count} batch${result.batch_count === 1 ? "" : "es"}).`,
				);
				form.reset();
				setSelectedUsers([]);
				onOpenChange(false);
			} catch (error) {
				toast.error(getV2ErrorMessage(error));
			}
		},
	});

	useEffect(() => {
		if (!open) {
			form.reset();
			setSelectedUsers([]);
			setRecipientError(null);
		}
	}, [open, form]);

	const handleOpenChange = (nextOpen: boolean) => {
		if (isSubmitting) return;
		onOpenChange(nextOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-2xl" showCloseButton={!isSubmitting}>
				<DialogHeader>
					<DialogTitle className="font-semibold">
						Send custom message
					</DialogTitle>
					<DialogDescription>
						Send an announcement email using the VerifyAfrica custom message layout.
						Batch delivery is queued through Celery (up to 100 recipients per Resend
						request).
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={(event) => {
						event.preventDefault();
						void form.handleSubmit();
					}}
				>
					<FieldGroup className="gap-4">
						<form.Field name="subject">
							{(field) => (
								<Field
									className="flex flex-col gap-2"
									data-invalid={field.state.meta.errors.length > 0}
								>
									<FieldLabel htmlFor="custom-message-subject">
										Subject
									</FieldLabel>
									<Input
										id="custom-message-subject"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										disabled={isSubmitting}
										placeholder="e.g. Platform maintenance notice"
										aria-invalid={field.state.meta.errors.length > 0}
									/>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							)}
						</form.Field>

						<form.Field name="message">
							{(field) => (
								<Field
									className="flex flex-col gap-2"
									data-invalid={field.state.meta.errors.length > 0}
								>
									<FieldLabel htmlFor="custom-message-body">Message</FieldLabel>
									<RichTextEditor
										id="custom-message-body"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={field.handleChange}
										disabled={isSubmitting}
										placeholder="Write the announcement body…"
										aria-invalid={field.state.meta.errors.length > 0}
									/>
									<p className="text-xs text-muted-foreground">
										Formatting from the toolbar is preserved in the email.
									</p>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							)}
						</form.Field>

						<form.Field name="audience">
							{(field) => (
								<Field className="flex flex-col gap-3">
									<FieldLabel>Recipients</FieldLabel>
									<RadioGroup
										value={field.state.value}
										onValueChange={(next) => {
											field.handleChange(next as AudienceMode);
											setRecipientError(null);
										}}
										disabled={isSubmitting}
										className="gap-3"
									>
										<div className="flex items-start gap-2">
											<RadioGroupItem
												value="all_users"
												id="audience-all-users"
												className="mt-0.5"
											/>
											<div className="grid gap-1">
												<Label htmlFor="audience-all-users">All users</Label>
												<p className="text-xs text-muted-foreground">
													Queue a Resend batch send to every active user.
												</p>
											</div>
										</div>
										<div className="flex items-start gap-2">
											<RadioGroupItem
												value="selected_users"
												id="audience-selected-users"
												className="mt-0.5"
											/>
											<div className="grid gap-1">
												<Label htmlFor="audience-selected-users">
													Select users
												</Label>
												<p className="text-xs text-muted-foreground">
													Search by user email or business name.
												</p>
											</div>
										</div>
									</RadioGroup>

									{field.state.value === "selected_users" ? (
										<div className="mt-1 flex flex-col gap-2">
											<AsyncCombobox
												value={selectedUsers}
												onChange={(next) => {
													setSelectedUsers(next);
													setRecipientError(null);
												}}
												onSearch={searchUsers}
												disabled={isSubmitting}
												placeholder="Search users…"
												searchPlaceholder="Search by email or business name…"
												emptyMessage="No users found."
											/>
											{recipientError ? (
												<p className="text-sm text-destructive">
													{recipientError}
												</p>
											) : null}
										</div>
									) : null}
								</Field>
							)}
						</form.Field>
					</FieldGroup>

					<DialogFooter className="mt-6">
						<Button
							type="button"
							variant="outline"
							onClick={() => handleOpenChange(false)}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Sending…" : "Send message"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
