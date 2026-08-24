import {
	BriefcaseIcon,
	EnvelopeSimpleIcon,
} from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";
import { toast } from "sonner";
import { getV2ErrorMessage } from "#/api/http/shared";
import { useCreateTenantInvitationV2Mutation } from "#/api/http/v2/tenants/tenants.hooks";
import {
	TenantInvitationCreateSchema,
	type TenantInvitationCreatePayload,
	type TenantRole,
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@verifyafrica/ui/components/ui/field";

const ROLE_OPTIONS: { value: TenantRole; label: string }[] = [
	{ value: "admin", label: "Admin" },
	{ value: "member", label: "Member" },
];

const InviteUserFormSchema = TenantInvitationCreateSchema.pick({
	email: true,
	role: true,
}).extend({
	role: TenantRoleSchema,
});

export function InviteUserDialog({
	open,
	tenantId,
	onOpenChange,
	onSuccess,
}: {
	open: boolean;
	tenantId: string;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}) {
	const createInvitationMutation = useCreateTenantInvitationV2Mutation(tenantId);
	const isSubmitting = createInvitationMutation.isPending;

	const defaultValues: TenantInvitationCreatePayload = {
		email: "",
		role: "member",
	};

	const form = useForm({
		defaultValues,
		validators: {
			onSubmit: InviteUserFormSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				await createInvitationMutation.mutateAsync(value);
				toast.success(`Invitation sent to ${value.email}`);
				form.reset();
				onOpenChange(false);
				onSuccess?.();
			} catch (error) {
				toast.error(getV2ErrorMessage(error));
			}
		},
	});

	useEffect(() => {
		if (!open) {
			form.reset();
		}
	}, [open, form]);

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen && isSubmitting) {
			return;
		}

		if (!nextOpen) {
			form.reset();
		}

		onOpenChange(nextOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md" showCloseButton={!isSubmitting}>
				<DialogHeader>
					<DialogTitle>Invite New User</DialogTitle>
				</DialogHeader>

				<form
					className="flex flex-col gap-4"
					onSubmit={(event) => {
						event.preventDefault();
						void form.handleSubmit();
					}}
				>
					<FieldGroup className="gap-4">
						<form.Field name="email">
							{(field) => (
								<Field
									className="flex flex-col gap-2"
									data-invalid={field.state.meta.errors.length > 0}
								>
									<FieldLabel htmlFor="invite-email">Email Address</FieldLabel>
									<div className="relative">
										<EnvelopeSimpleIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											id="invite-email"
											type="email"
											placeholder="user@example.com"
											className="pl-9"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											disabled={isSubmitting}
											autoFocus
											aria-invalid={field.state.meta.errors.length > 0}
										/>
									</div>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							)}
						</form.Field>

						<form.Field name="role">
							{(field) => (
								<Field
									className="flex flex-col gap-2"
									data-invalid={field.state.meta.errors.length > 0}
								>
									<FieldLabel>Role</FieldLabel>
									<Select
										value={field.state.value}
										onValueChange={(value) =>
											field.handleChange(value as TenantRole)
										}
										disabled={isSubmitting}
									>
										<SelectTrigger className="w-full">
											<div className="flex items-center gap-2">
												<BriefcaseIcon className="size-4 text-muted-foreground" />
												<SelectValue />
											</div>
										</SelectTrigger>
										<SelectContent>
											{ROLE_OPTIONS.map((role) => (
												<SelectItem key={role.value} value={role.value}>
													{role.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							)}
						</form.Field>
					</FieldGroup>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => handleOpenChange(false)}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Sending..." : "Send Invite"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
