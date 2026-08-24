import { BuildingsIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { type ComponentProps, useEffect } from "react";
import { toast } from "sonner";

import type { V2AxiosError } from "#/api/http/shared";
import { useCreateTenantV2Mutation } from "#/api/http/v2/tenants/tenants.hooks";
import { TenantSelfServiceCreateSchema } from "#/api/http/v2/tenants/tenants.types";
import { USER_V2_QUERY_KEYS } from "#/api/http/v2/users/users.hooks";
import { USERS_V2_API } from "#/api/http/v2/users/users.api";
import type { UserSession } from "#/api/http/v2/users/users.types";
import type { UserDetail } from "#/api/http/v1/users/users.types";
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
import { useAuthStore } from "#/stores/auth-store";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";

type CreateOrganizationDialogProps = ComponentProps<typeof Dialog> & {
	onCreated?: (tenantId: string) => void;
};

const toAuthStoreUser = (user: UserSession): UserDetail => ({
	...user,
	phone_number: user.phone_number ?? undefined,
	tenants: user.tenants,
	created_at: "",
});

export function CreateOrganizationDialog({
	open,
	onOpenChange,
	onCreated,
}: CreateOrganizationDialogProps) {
	const queryClient = useQueryClient();
	const createTenantMutation = useCreateTenantV2Mutation();
	const userEmail = useAuthStore((state) => state.user?.email ?? "");

	const form = useForm({
		defaultValues: {
			name: "",
		},
		validators: {
			onSubmit: TenantSelfServiceCreateSchema,
		},
		onSubmit: async ({ value }) => {
			const payload = TenantSelfServiceCreateSchema.parse(value);

			try {
				const tenant = await createTenantMutation.mutateAsync(payload);
				const user = await USERS_V2_API.ME();

				useAuthStore.setState({ user: toAuthStoreUser(user) });
				useAuthStore.getState().setSelectedTenantId(tenant.id);
				queryClient.setQueryData(USER_V2_QUERY_KEYS.me, user);
				await queryClient.invalidateQueries({
					queryKey: USER_V2_QUERY_KEYS.me,
				});

				toast.success("Organization created successfully");
				onOpenChange?.(false);
				onCreated?.(tenant.id);
			} catch (error) {
				const axiosError = error as V2AxiosError;
				const data = axiosError.response?.data;
				const message =
					data?.errors?.[0] ||
					data?.message ||
					axiosError.message ||
					"Failed to create organization";
				toast.error(message);
			}
		},
	});

	useEffect(() => {
		if (!open) {
			return;
		}

		form.setFieldValue("name", "");
	}, [open, form.setFieldValue]); // eslint-disable-line react-hooks/exhaustive-deps -- reset fields when dialog opens

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="font-semibold">
						Create organization
					</DialogTitle>
					<DialogDescription>
						Set up your own organization to continue using VerifyAfrica.
					</DialogDescription>
				</DialogHeader>

				<form
					id="create-organization-form"
					className="flex flex-col gap-4"
					onSubmit={(event) => {
						event.preventDefault();
						form.handleSubmit();
					}}
				>
					<FieldGroup className="gap-4">
						<form.Field name="name">
							{(field) => (
								<Field className="gap-2">
									<FieldLabel htmlFor="organization-name">
										Organization name
									</FieldLabel>
									<div className="relative">
										<BuildingsIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											id="organization-name"
											className="pl-9"
											placeholder="Acme Ltd"
											autoComplete="organization"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											aria-invalid={
												field.state.meta.isTouched && !field.state.meta.isValid
											}
										/>
									</div>
									{field.state.meta.isTouched && !field.state.meta.isValid ? (
										<FieldError errors={field.state.meta.errors} />
									) : null}
								</Field>
							)}
						</form.Field>

						<Field className="gap-2">
							<FieldLabel htmlFor="organization-email">
								Organization email
							</FieldLabel>
							<div className="relative">
								<EnvelopeSimpleIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									id="organization-email"
									type="email"
									className="pl-9"
									value={userEmail}
									readOnly
									disabled
									autoComplete="email"
								/>
							</div>
							<p className="text-xs text-muted-foreground">
								Uses your account email and cannot be changed.
							</p>
						</Field>
					</FieldGroup>
				</form>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange?.(false)}
						disabled={createTenantMutation.isPending}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						form="create-organization-form"
						disabled={createTenantMutation.isPending || !userEmail}
					>
						{createTenantMutation.isPending ? (
							<>
								<Loader2Icon className="size-4 animate-spin" />
								Creating...
							</>
						) : (
							"Create organization"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
