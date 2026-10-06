import { CalendarBlankIcon, LockKeyIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { getV2ErrorMessage } from "@verifyafrica/api-client/http/shared";
import type {
	TenantAccessRestriction,
	TenantAccessRestrictionUpdatePayload,
} from "@verifyafrica/api-client/http/v2/tenants/tenants.types";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@verifyafrica/ui/components/ui/alert-dialog";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Calendar } from "@verifyafrica/ui/components/ui/calendar";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import { Switch } from "@verifyafrica/ui/components/ui/switch";
import { format, parseISO, startOfToday } from "date-fns";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { z } from "zod";
import {
	useTenantAccessRestrictionV2Query,
	useUpdateTenantAccessRestrictionV2Mutation,
} from "#/api/http/v2/tenants/tenants.hooks";

const ISO_DATE_FORMAT = "yyyy-MM-dd";

type AccessRestrictionFormValues = {
	restricted: boolean;
	dateBased: boolean;
	startDate: string;
	endDate: string;
};

const AccessRestrictionFormSchema = z
	.object({
		restricted: z.boolean(),
		dateBased: z.boolean(),
		startDate: z.string(),
		endDate: z.string(),
	})
	.superRefine((value, ctx) => {
		if (!value.restricted || !value.dateBased) {
			return;
		}

		if (!value.startDate || !value.endDate) {
			ctx.addIssue({
				code: "custom",
				message: "Select a start and end date for the deactivation period",
				path: ["startDate"],
			});
			return;
		}

		if (value.endDate < format(startOfToday(), ISO_DATE_FORMAT)) {
			ctx.addIssue({
				code: "custom",
				message: "The end date cannot be in the past",
				path: ["startDate"],
			});
		}
	});

function toFormValues(
	restriction: TenantAccessRestriction | undefined,
): AccessRestrictionFormValues {
	const type = restriction?.restriction_type ?? "none";

	return {
		restricted: type !== "none",
		dateBased: type === "account_deactivated_period",
		startDate: restriction?.start_date ?? "",
		endDate: restriction?.end_date ?? "",
	};
}

function toPayload(
	value: AccessRestrictionFormValues,
): TenantAccessRestrictionUpdatePayload {
	if (!value.restricted) {
		return { restriction_type: "none" };
	}

	if (!value.dateBased) {
		return { restriction_type: "account_disabled" };
	}

	return {
		restriction_type: "account_deactivated_period",
		start_date: value.startDate,
		end_date: value.endDate,
	};
}

function formatDisplayDate(value: string) {
	return format(parseISO(value), "d MMM yyyy");
}

function AccessStatusBadge({
	restriction,
}: {
	restriction: TenantAccessRestriction;
}) {
	if (restriction.restriction_type === "none") {
		return <Badge variant="default">Active</Badge>;
	}

	if (restriction.restriction_type === "account_disabled") {
		return <Badge variant="destructive">Disabled</Badge>;
	}

	if (restriction.is_active) {
		return <Badge variant="destructive">Deactivated</Badge>;
	}

	const today = format(startOfToday(), ISO_DATE_FORMAT);
	if (restriction.start_date && restriction.start_date > today) {
		return <Badge variant="outline">Deactivation scheduled</Badge>;
	}

	return <Badge variant="outline">Deactivation period ended</Badge>;
}

export function TenantAccessRestrictionSection({
	tenantId,
	tenantName,
}: {
	tenantId: string;
	tenantName: string;
}) {
	const restrictionQuery = useTenantAccessRestrictionV2Query(tenantId);
	const updateMutation = useUpdateTenantAccessRestrictionV2Mutation(tenantId);
	const isSubmitting = updateMutation.isPending;
	const [pendingPayload, setPendingPayload] =
		useState<TenantAccessRestrictionUpdatePayload | null>(null);

	const restriction = restrictionQuery.data;

	const saveRestriction = async (
		payload: TenantAccessRestrictionUpdatePayload,
	) => {
		try {
			const updated = await updateMutation.mutateAsync(payload);
			toast.success(
				updated.restriction_type === "none"
					? "Account access restored"
					: "Account access restriction saved",
			);
			form.reset(toFormValues(updated));
			setPendingPayload(null);
		} catch (error) {
			toast.error(getV2ErrorMessage(error));
		}
	};

	const form = useForm({
		defaultValues: toFormValues(restriction),
		validators: {
			onSubmit: AccessRestrictionFormSchema,
		},
		onSubmit: async ({ value }) => {
			const payload = toPayload(value);

			if (payload.restriction_type === "none") {
				await saveRestriction(payload);
				return;
			}

			setPendingPayload(payload);
		},
	});

	useEffect(() => {
		if (restriction) {
			form.reset(toFormValues(restriction));
		}
	}, [form, restriction]);

	if (restrictionQuery.isLoading) {
		return <Skeleton className="h-40 w-full rounded-lg" />;
	}

	if (restrictionQuery.isError || !restriction) {
		return (
			<div className="rounded-lg border p-6 text-sm text-muted-foreground">
				{getV2ErrorMessage(restrictionQuery.error)}
			</div>
		);
	}

	return (
		<div className="rounded-lg border p-6">
			<div className="mb-6 flex flex-wrap items-start justify-between gap-4">
				<div className="flex items-start gap-4">
					<LockKeyIcon className="mt-0.5 size-6 shrink-0 text-muted-foreground" />
					<div>
						<h3 className="text-lg font-semibold">Account Access</h3>
						<p className="mt-1 text-sm text-muted-foreground">
							Blocks dashboard sign-in, API requests and pending verifications
							for every user in this tenant.
						</p>
						{restriction.restriction_type === "account_deactivated_period" &&
							restriction.start_date &&
							restriction.end_date && (
								<p className="mt-2 text-sm text-muted-foreground">
									Deactivated from{" "}
									<strong>{formatDisplayDate(restriction.start_date)}</strong>{" "}
									to <strong>{formatDisplayDate(restriction.end_date)}</strong>
								</p>
							)}
					</div>
				</div>
				<AccessStatusBadge restriction={restriction} />
			</div>

			<form
				className="flex flex-col gap-6"
				onSubmit={(event) => {
					event.preventDefault();
					void form.handleSubmit();
				}}
			>
				<FieldGroup className="gap-6">
					<form.Field name="restricted">
						{(field) => (
							<Field orientation="horizontal">
								<FieldContent>
									<FieldLabel htmlFor="tenant-access-restricted">
										Restrict account access
									</FieldLabel>
									<FieldDescription>
										Turn off to restore access immediately.
									</FieldDescription>
								</FieldContent>
								<Switch
									id="tenant-access-restricted"
									checked={field.state.value}
									onCheckedChange={field.handleChange}
									disabled={isSubmitting}
								/>
							</Field>
						)}
					</form.Field>

					<form.Subscribe selector={(state) => state.values.restricted}>
						{(restricted) =>
							restricted && (
								<form.Field name="dateBased">
									{(field) => (
										<Field orientation="horizontal">
											<FieldContent>
												<FieldLabel htmlFor="tenant-access-date-based">
													Date-based deactivation
												</FieldLabel>
												<FieldDescription>
													{field.state.value
														? "Access is blocked only within the selected dates."
														: "Access stays disabled until you restore it."}
												</FieldDescription>
											</FieldContent>
											<Switch
												id="tenant-access-date-based"
												checked={field.state.value}
												onCheckedChange={field.handleChange}
												disabled={isSubmitting}
											/>
										</Field>
									)}
								</form.Field>
							)
						}
					</form.Subscribe>

					<form.Subscribe
						selector={(state) =>
							state.values.restricted && state.values.dateBased
						}
					>
						{(showCalendar) =>
							showCalendar && (
								<form.Field name="startDate">
									{(field) => {
										const startDate = field.state.value;
										const endDate = form.getFieldValue("endDate");
										const selected: DateRange | undefined = startDate
											? {
													from: parseISO(startDate),
													to: endDate ? parseISO(endDate) : undefined,
												}
											: undefined;

										return (
											<Field
												className="flex flex-col gap-3"
												data-invalid={field.state.meta.errors.length > 0}
											>
												<div className="flex flex-wrap items-center justify-between gap-3">
													<FieldLabel>Deactivation period</FieldLabel>
													<p className="flex items-center gap-1.5 text-sm text-muted-foreground">
														<CalendarBlankIcon className="size-4" />
														{startDate && endDate
															? `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`
															: startDate
																? `${formatDisplayDate(startDate)} – select end date`
																: "Select start and end dates"}
													</p>
												</div>
												<div className="w-fit rounded-lg border p-3">
													<Calendar
														mode="range"
														numberOfMonths={2}
														selected={selected}
														defaultMonth={selected?.from ?? startOfToday()}
														disabled={[{ before: startOfToday() }]}
														onSelect={(range) => {
															field.handleChange(
																range?.from
																	? format(range.from, ISO_DATE_FORMAT)
																	: "",
															);
															form.setFieldValue(
																"endDate",
																range?.to
																	? format(range.to, ISO_DATE_FORMAT)
																	: "",
															);
														}}
													/>
												</div>
												<FieldDescription>
													Both dates are inclusive: access is blocked from 00:00
													on the start date until 23:59 on the end date (West
													Africa Time).
												</FieldDescription>
												<FieldError errors={field.state.meta.errors} />
											</Field>
										);
									}}
								</form.Field>
							)
						}
					</form.Subscribe>
				</FieldGroup>

				<form.Subscribe selector={(state) => state.isDirty}>
					{(isDirty) => (
						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								disabled={!isDirty || isSubmitting}
								onClick={() => form.reset(toFormValues(restriction))}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={!isDirty || isSubmitting}
							>
								{isSubmitting ? "Saving..." : "Save Changes"}
							</Button>
						</div>
					)}
				</form.Subscribe>
			</form>

			<AlertDialog
				open={pendingPayload !== null}
				onOpenChange={(nextOpen) => {
					if (!nextOpen && !isSubmitting) {
						setPendingPayload(null);
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Restrict Account Access?</AlertDialogTitle>
						<AlertDialogDescription>
							{pendingPayload?.restriction_type ===
							"account_deactivated_period" ? (
								<>
									Users of <strong>{tenantName}</strong> will not be able to use
									the dashboard or API from{" "}
									<strong>
										{formatDisplayDate(pendingPayload.start_date)}
									</strong>{" "}
									to{" "}
									<strong>{formatDisplayDate(pendingPayload.end_date)}</strong>.
									They will be notified by email when the deactivation takes
									effect.
								</>
							) : (
								<>
									Users of <strong>{tenantName}</strong> will immediately lose
									access to the dashboard and API until you restore it. They
									will be notified by email.
								</>
							)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isSubmitting}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							disabled={isSubmitting}
							onClick={(event) => {
								event.preventDefault();
								if (pendingPayload) {
									void saveRestriction(pendingPayload);
								}
							}}
						>
							{isSubmitting ? "Saving..." : "Restrict Access"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
