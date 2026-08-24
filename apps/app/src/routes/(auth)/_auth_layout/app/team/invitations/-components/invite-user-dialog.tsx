import {
	EnvelopeSimpleIcon,
	IdentificationCardIcon,
} from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { Loader2Icon } from "lucide-react";
import { type ComponentProps, type ComponentType, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { useCreateTenantInvitationV2Mutation } from "#/api/http/v2/tenants/tenants.hooks";
import {
	TenantInvitationCreateSchema,
	TenantRoleSchema,
} from "#/api/http/v2/tenants/tenants.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@verifyafrica/ui/components/ui/dialog";
import { Input } from "@verifyafrica/ui/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import { cn } from "#/lib/utils.ts";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";
import { INVITATION_ROLES, ROLE_LABELS, type TenantUserRole } from "../-data";

const InviteUserFormSchema = z.object({
	email: z.email({ message: "Invalid email address" }),
	role: TenantRoleSchema,
});

type InviteUserFormValues = z.infer<typeof InviteUserFormSchema>;

type InviteUserDialogProps = ComponentProps<typeof Dialog> & {
	tenantId?: string;
};

function IconField({
	id,
	label,
	icon: Icon,
	children,
	className,
}: {
	id: string;
	label: string;
	icon?: ComponentType<{ className?: string }>;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("space-y-2", className)}>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<div className="relative">
				{Icon && (
					<Icon className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
				)}
				{children}
			</div>
		</div>
	);
}

export function InviteUserDialog({
	open,
	onOpenChange,
	tenantId,
}: InviteUserDialogProps) {
	const inviteMutation = useCreateTenantInvitationV2Mutation(tenantId ?? "");

	const form = useForm({
		defaultValues: {
			email: "",
			role: "member",
		} as InviteUserFormValues,
		validators: {
			onSubmit: InviteUserFormSchema,
		},
		onSubmit: async ({ value }) => {
			if (!tenantId) {
				toast.error("Tenant information is unavailable");
				return;
			}

			const payload = TenantInvitationCreateSchema.parse(value);

			await inviteMutation.mutateAsync(payload, {
				onSuccess: () => {
					toast.success("User invitation sent successfully");
					onOpenChange?.(false);
				},
				onError: () => {
					toast.error("Failed to send invitation. Please try again.");
				},
			});
		},
	});

	useEffect(() => {
		if (!open) {
			form.reset();
		}
	}, [open, form]);

	const isSubmitting = inviteMutation.isPending;

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
		>
			<DialogContent className="sm:max-w-md">
				<div className="relative flex flex-col gap-6">
					{isSubmitting ? (
						<div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-popover/80">
							<Loader2Icon className="size-8 animate-spin text-primary" />
						</div>
					) : null}
					<DialogHeader>
						<DialogTitle className="font-semibold">Invite New User</DialogTitle>
					</DialogHeader>

					<form
						className="flex flex-col gap-4"
						onSubmit={(event) => {
							event.preventDefault();
							form.handleSubmit();
						}}
					>
						<FieldGroup className="flex flex-col gap-2">
							<form.Field name="email">
								{(field) => (
									<Field
										className="flex flex-col space-y-1 gap-1"
										data-invalid={field.state.meta.errors.length > 0}
									>
										<IconField
											id="invite-email"
											label="Email Address"
											icon={EnvelopeSimpleIcon}
										>
											<Input
												id="invite-email"
												type="email"
												placeholder="user@example.com"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
												className="pl-10"
												autoFocus
												disabled={isSubmitting}
												aria-invalid={field.state.meta.errors.length > 0}
											/>
										</IconField>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								)}
							</form.Field>

							<form.Field name="role">
								{(field) => (
									<Field
										className="flex flex-col space-y-1 gap-1"
										data-invalid={field.state.meta.errors.length > 0}
									>
										<IconField
											id="invite-role"
											label="Role"
											icon={IdentificationCardIcon}
										>
											<Select
												value={field.state.value}
												onValueChange={(value) =>
													field.handleChange(value as TenantUserRole)
												}
												disabled={isSubmitting}
											>
												<SelectTrigger
													id="invite-role"
													className="w-full pl-10"
												>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{INVITATION_ROLES.map((option) => (
														<SelectItem
															key={option}
															value={option}
														>
															{ROLE_LABELS[option]}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</IconField>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								)}
							</form.Field>
						</FieldGroup>

						<DialogFooter>
							<Button
								type="button"
								variant="ghost"
								className="cursor-pointer text-primary"
								onClick={() => onOpenChange?.(false)}
								disabled={isSubmitting}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={isSubmitting || !tenantId}
								className="cursor-pointer tracking-wide"
							>
								{isSubmitting ? "Sending..." : "Send Invitation"}
							</Button>
						</DialogFooter>
					</form>
				</div>
			</DialogContent>
		</Dialog>
	);
}
