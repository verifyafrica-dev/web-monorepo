import { getV2ErrorMessage } from "@verifyafrica/api-client/http/shared";
import type {
	TmFeature,
	TmTemplate,
} from "@verifyafrica/api-client/http/v2/transaction-monitoring/transaction-monitoring.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Checkbox } from "@verifyafrica/ui/components/ui/checkbox";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import { Slider } from "@verifyafrica/ui/components/ui/slider";
import { Switch } from "@verifyafrica/ui/components/ui/switch";
import { Textarea } from "@verifyafrica/ui/components/ui/textarea";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	useCreateTmPlatformTemplateV2Mutation,
	useUpdateTmPlatformTemplateV2Mutation,
} from "#/api/http/v2/transaction-monitoring/transaction-monitoring.hooks";
import {
	ANY_EVENT,
	buildCreatePayload,
	buildUpdatePayload,
	EMPTY_TEMPLATE_FORM,
	type FeatureSelection,
	GROUP_LABELS,
	roundWeight,
	TemplateFormSchema,
	type TemplateFormState,
	TM_EVENT_OPTIONS,
	titleCase,
	toSelection,
	toTemplateFormState,
} from "../-data";

interface TemplateFormDialogProps {
	open: boolean;
	/** `null` = create. */
	template: TmTemplate | null;
	catalog: TmFeature[];
	catalogLoading: boolean;
	catalogError: boolean;
	onOpenChange: (open: boolean) => void;
}

export function TemplateFormDialog({
	open,
	template,
	catalog,
	catalogLoading,
	catalogError,
	onOpenChange,
}: TemplateFormDialogProps) {
	const isEdit = template !== null;
	const [form, setForm] = useState<TemplateFormState>(EMPTY_TEMPLATE_FORM);
	const [selection, setSelection] = useState<FeatureSelection>({});
	const createMutation = useCreateTmPlatformTemplateV2Mutation();
	const updateMutation = useUpdateTmPlatformTemplateV2Mutation();
	const isSaving = createMutation.isPending || updateMutation.isPending;

	// Re-seed whenever the dialog opens (or its target / catalog changes).
	useEffect(() => {
		if (!open) return;
		setForm(template ? toTemplateFormState(template) : EMPTY_TEMPLATE_FORM);
		setSelection(toSelection(template, catalog));
	}, [open, template, catalog]);

	const groups = useMemo(() => {
		const map = new Map<string, TmFeature[]>();
		for (const feature of catalog) {
			map.set(feature.group, [...(map.get(feature.group) ?? []), feature]);
		}
		return [...map.entries()];
	}, [catalog]);

	function patch<K extends keyof TemplateFormState>(
		field: K,
		value: TemplateFormState[K],
	) {
		setForm((current) => ({ ...current, [field]: value }));
	}

	function toggle(feature: TmFeature, checked: boolean) {
		setSelection((current) => {
			const next = { ...current };
			if (checked)
				next[feature.key] = current[feature.key] ?? feature.default_weight;
			else delete next[feature.key];
			return next;
		});
	}

	function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		const parsed = TemplateFormSchema.safeParse(form);
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "Check the form");
			return;
		}
		if (Object.keys(selection).length === 0) {
			toast.error("Select at least one feature");
			return;
		}

		const onError = (error: unknown) =>
			toast.error(getV2ErrorMessage(error, "Failed to save template."));

		if (isEdit && template) {
			updateMutation.mutate(
				{
					templateId: template.id,
					payload: buildUpdatePayload(form, selection),
				},
				{
					onSuccess: () => {
						toast.success("Template updated");
						onOpenChange(false);
					},
					onError,
				},
			);
			return;
		}

		createMutation.mutate(buildCreatePayload(form, selection), {
			onSuccess: () => {
				toast.success("Template created");
				onOpenChange(false);
			},
			onError,
		});
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => !isSaving && onOpenChange(next)}
		>
			<DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-3xl">
				<form
					onSubmit={handleSubmit}
					className="flex min-h-0 flex-1 flex-col"
					noValidate
				>
					<DialogHeader className="border-b px-6 py-4">
						<DialogTitle>
							{isEdit ? `Edit ${template?.name}` : "New platform template"}
						</DialogTitle>
						<DialogDescription>
							Templates seed new monitors for every tenant. Editing one never
							changes monitors that were already created from it.
						</DialogDescription>
					</DialogHeader>

					<div className="flex-1 overflow-y-auto px-6 py-5">
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="flex flex-col gap-2">
								<Label htmlFor="tm-tpl-name">Name</Label>
								<Input
									id="tm-tpl-name"
									value={form.name}
									maxLength={255}
									disabled={isSaving}
									onChange={(e) => patch("name", e.target.value)}
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="tm-tpl-slug">Slug</Label>
								<Input
									id="tm-tpl-slug"
									value={form.slug}
									maxLength={64}
									placeholder="tmpl_ng_transfer_aml"
									disabled={isSaving || isEdit}
									onChange={(e) => patch("slug", e.target.value)}
								/>
								<p className="text-xs text-muted-foreground">
									{isEdit
										? "The slug is the template ID and can't be changed."
										: "Becomes the template ID tenants send as template_id."}
								</p>
							</div>
							<div className="flex flex-col gap-2 sm:col-span-2">
								<Label htmlFor="tm-tpl-desc">Description</Label>
								<Textarea
									id="tm-tpl-desc"
									rows={2}
									value={form.description}
									disabled={isSaving}
									onChange={(e) => patch("description", e.target.value)}
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="tm-tpl-event">Event</Label>
								<Select
									value={form.event}
									onValueChange={(value) => patch("event", value)}
									disabled={isSaving}
								>
									<SelectTrigger id="tm-tpl-event" className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={ANY_EVENT}>Any event</SelectItem>
										{TM_EVENT_OPTIONS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="flex flex-col gap-2">
									<Label htmlFor="tm-tpl-region">Region</Label>
									<Input
										id="tm-tpl-region"
										value={form.region}
										maxLength={16}
										disabled={isSaving}
										onChange={(e) =>
											patch("region", e.target.value.toUpperCase())
										}
									/>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor="tm-tpl-order">Sort order</Label>
									<Input
										id="tm-tpl-order"
										type="number"
										min={0}
										value={form.sortOrder}
										disabled={isSaving}
										onChange={(e) =>
											patch(
												"sortOrder",
												Math.max(0, Math.trunc(Number(e.target.value) || 0)),
											)
										}
									/>
								</div>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="tm-tpl-industry">Industry</Label>
								<Input
									id="tm-tpl-industry"
									value={form.industry}
									maxLength={64}
									disabled={isSaving}
									onChange={(e) => patch("industry", e.target.value)}
								/>
							</div>
							<div className="flex items-center justify-between gap-4 rounded-lg border p-3">
								<div className="flex flex-col gap-1">
									<Label htmlFor="tm-tpl-active">Visible to tenants</Label>
									<p className="text-xs text-muted-foreground">
										Disabled templates are hidden from the Templates tab.
									</p>
								</div>
								<Switch
									id="tm-tpl-active"
									checked={form.isActive}
									disabled={isSaving}
									onCheckedChange={(value) => patch("isActive", value)}
								/>
							</div>
						</div>

						<div className="mt-8 flex flex-col gap-4">
							<div className="flex items-baseline justify-between">
								<h3 className="text-sm font-semibold">Features</h3>
								<span className="text-xs text-muted-foreground tabular-nums">
									{Object.keys(selection).length} selected
								</span>
							</div>

							{catalogLoading ? (
								<p className="py-6 text-center text-sm text-muted-foreground">
									Loading feature catalog…
								</p>
							) : catalogError ? (
								<p className="py-6 text-center text-sm text-destructive">
									Unable to load the feature catalog.
								</p>
							) : (
								groups.map(([group, items]) => (
									<section key={group} className="flex flex-col gap-2">
										<h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
											{GROUP_LABELS[group] ?? titleCase(group)}
										</h4>
										<ul className="flex flex-col divide-y rounded-lg border">
											{items.map((feature) => {
												const checked = feature.key in selection;
												const weight =
													selection[feature.key] ?? feature.default_weight;
												const id = `tm-tpl-feature-${feature.key}`;
												return (
													<li
														key={feature.key}
														className="flex flex-col gap-2 p-3"
													>
														<div className="flex items-start gap-3">
															<Checkbox
																id={id}
																checked={checked}
																disabled={isSaving}
																onCheckedChange={(value) =>
																	toggle(feature, value === true)
																}
																className="mt-0.5"
															/>
															<label
																htmlFor={id}
																className="flex flex-1 cursor-pointer flex-col gap-0.5"
															>
																<span className="text-sm font-medium">
																	{feature.label}
																</span>
																<span className="text-xs text-muted-foreground">
																	{feature.description}
																</span>
															</label>
														</div>
														{checked && (
															<div className="flex items-center gap-3 pl-7">
																<Slider
																	min={0}
																	max={1}
																	step={0.05}
																	value={[weight]}
																	disabled={isSaving}
																	aria-label={`${feature.label} weight`}
																	onValueChange={([value]) =>
																		setSelection((current) => ({
																			...current,
																			[feature.key]: roundWeight(
																				value ?? weight,
																			),
																		}))
																	}
																/>
																<span className="w-10 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
																	{weight.toFixed(2)}
																</span>
															</div>
														)}
													</li>
												);
											})}
										</ul>
									</section>
								))
							)}
						</div>
					</div>

					<DialogFooter className="border-t px-6 py-4">
						<Button
							type="button"
							variant="outline"
							disabled={isSaving}
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isSaving || catalogLoading || catalogError}
						>
							{isSaving
								? "Saving…"
								: isEdit
									? "Save changes"
									: "Create template"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
