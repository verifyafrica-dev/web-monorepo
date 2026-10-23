import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useForm } from "@tanstack/react-form";
import {
	CaretDownIcon,
	CaretUpIcon,
	DotsSixVerticalIcon,
	PlusIcon,
} from "@phosphor-icons/react";
import { useEffect } from "react";
import { toast } from "sonner";

import {
	useCreateMixedVerificationV2Mutation,
	useUpdateMixedVerificationV2Mutation,
} from "#/api/http/v2/verifications/verifications.hooks";
import type { MixedVerification } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { AddressDocumentTypesMultiCombobox } from "@verifyafrica/ui/components/ui-extended/address-document-types-combobox";
import { CountryOptionLabel } from "@verifyafrica/ui/components/ui-extended/country-flag";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@verifyafrica/ui/components/ui/accordion";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@verifyafrica/ui/components/ui/dropdown-menu";
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
import { pickChangedFields } from "@verifyafrica/ui/lib/pick-changed-fields";
import {
	formatShuftiDocumentTypeLabel,
	SHUFTI_DOCUMENT_SUPPORTED_TYPES,
	type ShuftiAddressSupportedType,
	type ShuftiDocumentSupportedType,
} from "@verifyafrica/ui/lib/constants";
import { cn } from "@verifyafrica/ui/lib/utils";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";
import { useTenantSupportedCountries } from "../../-countries";
import {
	AML_SCREENING_FILTERS,
	type AmlScreeningFilterKey,
	buildCustomVerificationPayload,
	CUSTOM_MIXED_BASE_TYPE_OPTIONS,
	type CustomMixedVerificationType,
	type FaceVerificationMode,
	type MixedStepFormValue,
	createMixedStep,
	CustomVerificationFormSchema,
	formatVerificationTypeLabel,
	getCustomVerificationFormValues,
	grcStepSupportsSelfie,
	isAmlMixedStepType,
	isGrcMixedStepType,
	MIXED_GRC_MENU_GROUPS,
} from "../-data";
import { FACE_VERIFICATION_MODES } from "../../facial-screening/-data";

function isPortaledOverlayTarget(target: EventTarget | null) {
	if (!(target instanceof Element)) {
		return false;
	}
	return Boolean(
		target.closest('[data-slot="combobox-content"]') ||
			target.closest('[data-slot="select-content"]') ||
			target.closest('[data-slot="dropdown-menu-content"]') ||
			target.closest('[data-slot="dropdown-menu-sub-content"]'),
	);
}

function SortableStepCard({
	step,
	index,
	disabled,
	onRemove,
	onChange,
	countries,
}: {
	step: MixedStepFormValue;
	index: number;
	disabled?: boolean;
	onRemove: () => void;
	onChange: (next: MixedStepFormValue) => void;
	countries: Array<{ code: string; name: string }>;
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({ id: step.id });

	const showDocumentConfig = step.type === "id_document";
	const showAddressConfig = step.type === "address_verification";
	const showFaceConfig = step.type === "face_match";
	const showAmlConfig = isAmlMixedStepType(step.type);
	const showGrcConfig =
		isGrcMixedStepType(step.type) && grcStepSupportsSelfie(step.type);
	const showCountry =
		step.type === "id_document" ||
		step.type === "address_verification" ||
		step.type === "face_match";
	const hasExtraConfig =
		showDocumentConfig ||
		showAddressConfig ||
		showCountry ||
		showFaceConfig ||
		showAmlConfig ||
		showGrcConfig;

	function toggleDocumentType(type: ShuftiDocumentSupportedType, checked: boolean) {
		const next = checked
			? [...step.config.documentTypes, type]
			: step.config.documentTypes.filter((item) => item !== type);
		onChange({
			...step,
			config: {
				...step.config,
				documentTypes: next,
			},
		});
	}

	function toggleAmlFilter(key: AmlScreeningFilterKey, checked: boolean) {
		onChange({
			...step,
			config: {
				...step.config,
				amlFilters: {
					...step.config.amlFilters,
					[key]: checked,
				},
			},
		});
	}

	return (
		<AccordionItem
			ref={setNodeRef}
			value={step.id}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
			}}
			className={cn(
				"rounded-lg border bg-background px-0",
				isDragging && "z-10 opacity-90 shadow-md",
			)}
		>
				<div className="flex items-center gap-3 px-2">
					<button
						type="button"
						className="cursor-grab touch-none p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
						aria-label={`Reorder ${formatVerificationTypeLabel(step.type)}`}
						disabled={disabled}
						{...attributes}
						{...listeners}
					>
						<DotsSixVerticalIcon className="size-5" weight="bold" />
					</button>
					<AccordionTrigger className="flex flex-1 items-center justify-between gap-3 py-3 hover:no-underline **:data-[slot=accordion-trigger-icon]:hidden">
						<span className="flex items-center gap-2 text-left">
							<span className="text-xs font-medium tabular-nums text-muted-foreground">
								{index + 1}.
							</span>
							<span className="text-sm font-medium">
								{formatVerificationTypeLabel(step.type)}
							</span>
						</span>
						<span className="flex items-center gap-3">
							<CaretDownIcon className="pointer-events-none size-4 shrink-0 text-muted-foreground group-aria-expanded/accordion-trigger:hidden" />
							<CaretUpIcon className="pointer-events-none hidden size-4 shrink-0 text-muted-foreground group-aria-expanded/accordion-trigger:inline" />
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="cursor-pointer text-destructive"
								disabled={disabled}
								onClick={(event) => {
									event.preventDefault();
									event.stopPropagation();
									onRemove();
								}}
							>
								Remove
							</Button>
						</span>
					</AccordionTrigger>
				</div>

				<AccordionContent className="px-3 pb-3">
					<div className="space-y-3 border-t pt-3">
						{showCountry ? (
							<Field className="gap-1.5">
								<FieldLabel htmlFor={`mixed-step-country-${step.id}`}>
									Country
								</FieldLabel>
								<Select
									value={
										step.config.country
											? step.config.country.toUpperCase()
											: undefined
									}
									onValueChange={(value) =>
										onChange({
											...step,
											config: {
												...step.config,
												country: (value ?? "").toUpperCase(),
											},
										})
									}
									disabled={disabled}
								>
									<SelectTrigger
										id={`mixed-step-country-${step.id}`}
										className="w-full"
									>
										<SelectValue placeholder="Optional default country" />
									</SelectTrigger>
									<SelectContent className="z-200">
										{countries.map((country) => {
											const code = country.code.trim().toUpperCase();
											return (
												<SelectItem key={code} value={code}>
													<CountryOptionLabel
														name={country.name}
														countryCode={code}
													/>
												</SelectItem>
											);
										})}
									</SelectContent>
								</Select>
								<FieldDescription>
									Optional. Used as the default country for this step.
								</FieldDescription>
							</Field>
						) : null}

						{showDocumentConfig ? (
							<>
								<Field className="gap-1.5">
									<div className="flex items-center justify-between gap-3">
										<div className="min-w-0 space-y-1">
											<Label
												htmlFor={`mixed-step-allow-file-upload-${step.id}`}
												className="text-sm font-medium"
											>
												Allow file upload
											</Label>
											<FieldDescription>
												Overrides the product file-upload setting for this
												step. When off, customers must use the camera only.
											</FieldDescription>
										</div>
										<Switch
											id={`mixed-step-allow-file-upload-${step.id}`}
											checked={step.config.allowFileUpload}
											disabled={disabled}
											onCheckedChange={(checked) =>
												onChange({
													...step,
													config: {
														...step.config,
														allowFileUpload: checked === true,
													},
												})
											}
											className="shrink-0"
										/>
									</div>
								</Field>
								<Field className="gap-2">
									<FieldLabel>Allowed document types</FieldLabel>
									<div className="grid gap-2 sm:grid-cols-3">
										{SHUFTI_DOCUMENT_SUPPORTED_TYPES.map((type) => {
											const checkboxId = `mixed-step-doc-${type}-${step.id}`;
											const checked = step.config.documentTypes.includes(type);
											return (
												<div
													key={type}
													className="flex items-center gap-2"
												>
													<Checkbox
														id={checkboxId}
														checked={checked}
														disabled={disabled}
														onCheckedChange={(next) =>
															toggleDocumentType(type, next === true)
														}
													/>
													<Label
														htmlFor={checkboxId}
														className="text-sm font-normal"
													>
														{formatShuftiDocumentTypeLabel(type)}
													</Label>
												</div>
											);
										})}
									</div>
									<FieldDescription>
										Leave all unchecked to allow every ID document type.
									</FieldDescription>
								</Field>
								<Field className="gap-2">
									<FieldLabel>Collect additional fields</FieldLabel>
									<div className="grid gap-2 sm:grid-cols-2">
										{(
											[
												["dob", "Date of birth"],
												["age", "Age"],
												["gender", "Gender"],
												["backsideProofRequired", "Require backside"],
											] as const
										).map(([key, label]) => (
											<div key={key} className="flex items-center gap-2">
												<Checkbox
													id={`mixed-step-${key}-${step.id}`}
													checked={step.config[key]}
													disabled={disabled}
													onCheckedChange={(checked) =>
														onChange({
															...step,
															config: {
																...step.config,
																[key]: checked === true,
															},
														})
													}
												/>
												<Label
													htmlFor={`mixed-step-${key}-${step.id}`}
													className="text-sm font-normal"
												>
													{label}
												</Label>
											</div>
										))}
									</div>
								</Field>
								<Field className="gap-1.5">
									<FieldLabel htmlFor={`mixed-step-instructions-${step.id}`}>
										Verification instructions
									</FieldLabel>
									<Textarea
										id={`mixed-step-instructions-${step.id}`}
										rows={2}
										value={step.config.verificationInstructions}
										disabled={disabled}
										onChange={(event) =>
											onChange({
												...step,
												config: {
													...step.config,
													verificationInstructions: event.target.value,
												},
											})
										}
									/>
								</Field>
							</>
						) : null}

						{showAddressConfig ? (
							<>
								<Field className="gap-1.5">
									<FieldLabel htmlFor={`mixed-step-addr-types-${step.id}`}>
										Allowed address document types
									</FieldLabel>
									<AddressDocumentTypesMultiCombobox
										id={`mixed-step-addr-types-${step.id}`}
										value={step.config.addressDocumentTypes}
										disabled={disabled}
										onValueChange={(next) =>
											onChange({
												...step,
												config: {
													...step.config,
													addressDocumentTypes:
														next as ShuftiAddressSupportedType[],
												},
											})
										}
									/>
									<FieldDescription>
										Leave empty to allow all address document types. Full
										address is collected when starting the session.
									</FieldDescription>
								</Field>
								<Field className="gap-1.5">
									<FieldLabel htmlFor={`mixed-step-addr-instructions-${step.id}`}>
										Verification instructions
									</FieldLabel>
									<Textarea
										id={`mixed-step-addr-instructions-${step.id}`}
										rows={2}
										value={step.config.verificationInstructions}
										disabled={disabled}
										onChange={(event) =>
											onChange({
												...step,
												config: {
													...step.config,
													verificationInstructions: event.target.value,
												},
											})
										}
									/>
								</Field>
							</>
						) : null}

						{showFaceConfig ? (
							<>
								<Field className="gap-1.5">
									<FieldLabel htmlFor={`mixed-step-face-mode-${step.id}`}>
										Verification mode
									</FieldLabel>
									<Select
										value={step.config.faceVerificationMode}
										onValueChange={(value) =>
											onChange({
												...step,
												config: {
													...step.config,
													faceVerificationMode:
														(value as FaceVerificationMode) ?? "image",
												},
											})
										}
										disabled={disabled}
									>
										<SelectTrigger
											id={`mixed-step-face-mode-${step.id}`}
											className="w-full"
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="z-200">
											{FACE_VERIFICATION_MODES.map((mode) => (
												<SelectItem key={mode.value} value={mode.value}>
													{mode.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</Field>
								<div className="flex items-center gap-2">
									<Checkbox
										id={`mixed-step-face-dup-${step.id}`}
										checked={step.config.checkForDuplicates}
										disabled={disabled}
										onCheckedChange={(checked) =>
											onChange({
												...step,
												config: {
													...step.config,
													checkForDuplicates: checked === true,
												},
											})
										}
									/>
									<Label
										htmlFor={`mixed-step-face-dup-${step.id}`}
										className="text-sm font-normal"
									>
										Check for duplicate requests
									</Label>
								</div>
								<div className="grid gap-3 sm:grid-cols-2">
									<Field className="gap-1.5">
										<FieldLabel htmlFor={`mixed-step-face-age-min-${step.id}`}>
											Minimum age
										</FieldLabel>
										<Input
											id={`mixed-step-face-age-min-${step.id}`}
											type="number"
											min={16}
											value={step.config.faceAgeMin}
											disabled={disabled}
											onChange={(event) =>
												onChange({
													...step,
													config: {
														...step.config,
														faceAgeMin: event.target.value,
													},
												})
											}
										/>
									</Field>
									<Field className="gap-1.5">
										<FieldLabel htmlFor={`mixed-step-face-age-max-${step.id}`}>
											Maximum age
										</FieldLabel>
										<Input
											id={`mixed-step-face-age-max-${step.id}`}
											type="number"
											min={16}
											value={step.config.faceAgeMax}
											disabled={disabled}
											onChange={(event) =>
												onChange({
													...step,
													config: {
														...step.config,
														faceAgeMax: event.target.value,
													},
												})
											}
										/>
									</Field>
								</div>
								<Field className="gap-1.5">
									<FieldLabel htmlFor={`mixed-step-face-instructions-${step.id}`}>
										Verification instructions
									</FieldLabel>
									<Textarea
										id={`mixed-step-face-instructions-${step.id}`}
										rows={2}
										value={step.config.verificationInstructions}
										disabled={disabled}
										onChange={(event) =>
											onChange({
												...step,
												config: {
													...step.config,
													verificationInstructions: event.target.value,
												},
											})
										}
									/>
								</Field>
							</>
						) : null}

						{showAmlConfig ? (
							<>
								<Field className="gap-2">
									<FieldLabel>Screening filters</FieldLabel>
									<div className="grid gap-2 sm:grid-cols-2">
										{AML_SCREENING_FILTERS.map((filter) => {
											const checkboxId = `mixed-step-aml-${filter.key}-${step.id}`;
											return (
												<div
													key={filter.key}
													className="flex items-center gap-2"
												>
													<Checkbox
														id={checkboxId}
														checked={step.config.amlFilters[filter.key]}
														disabled={disabled}
														onCheckedChange={(checked) =>
															toggleAmlFilter(filter.key, checked === true)
														}
													/>
													<Label
														htmlFor={checkboxId}
														className="text-sm font-normal"
													>
														{filter.label}
													</Label>
												</div>
											);
										})}
									</div>
								</Field>
								<Field className="gap-2">
									<FieldLabel htmlFor={`mixed-step-match-score-${step.id}`}>
										Match score ({step.config.matchScore})
									</FieldLabel>
									<Slider
										id={`mixed-step-match-score-${step.id}`}
										min={0}
										max={100}
										step={1}
										value={[step.config.matchScore]}
										disabled={disabled}
										onValueChange={(value) =>
											onChange({
												...step,
												config: {
													...step.config,
													matchScore: value[0] ?? step.config.matchScore,
												},
											})
										}
									/>
									<FieldDescription>
										Minimum similarity score required for a match.
									</FieldDescription>
								</Field>
								<div className="flex items-center gap-2">
									<Checkbox
										id={`mixed-step-rca-${step.id}`}
										checked={step.config.rcaSearch}
										disabled={disabled}
										onCheckedChange={(checked) =>
											onChange({
												...step,
												config: {
													...step.config,
													rcaSearch: checked === true,
												},
											})
										}
									/>
									<Label
										htmlFor={`mixed-step-rca-${step.id}`}
										className="text-sm font-normal"
									>
										RCA search
									</Label>
								</div>
								<div className="flex items-center gap-2">
									<Checkbox
										id={`mixed-step-alias-${step.id}`}
										checked={step.config.aliasSearch}
										disabled={disabled}
										onCheckedChange={(checked) =>
											onChange({
												...step,
												config: {
													...step.config,
													aliasSearch: checked === true,
												},
											})
										}
									/>
									<Label
										htmlFor={`mixed-step-alias-${step.id}`}
										className="text-sm font-normal"
									>
										Alias search
									</Label>
								</div>
								<Field className="gap-1.5">
									<FieldLabel htmlFor={`mixed-step-aml-context-${step.id}`}>
										Context (optional)
									</FieldLabel>
									<Textarea
										id={`mixed-step-aml-context-${step.id}`}
										rows={2}
										value={step.config.amlContext}
										disabled={disabled}
										onChange={(event) =>
											onChange({
												...step,
												config: {
													...step.config,
													amlContext: event.target.value,
												},
											})
										}
									/>
								</Field>
							</>
						) : null}

						{showGrcConfig ? (
							<div className="flex items-center gap-2">
								<Checkbox
									id={`mixed-step-require-selfie-${step.id}`}
									checked={step.config.requireSelfie}
									disabled={disabled}
									onCheckedChange={(checked) =>
										onChange({
											...step,
											config: {
												...step.config,
												requireSelfie: checked === true,
											},
										})
									}
								/>
								<Label
									htmlFor={`mixed-step-require-selfie-${step.id}`}
									className="text-sm font-normal"
								>
									Require selfie on hosted link
								</Label>
							</div>
						) : null}

						{!hasExtraConfig ? (
							<p className="text-xs text-muted-foreground">
								No extra configuration for this verification type.
							</p>
						) : null}
					</div>
				</AccordionContent>
		</AccordionItem>
	);
}

type CustomVerificationDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	tenantId: string;
	template?: MixedVerification | null;
};

export function CustomVerificationDialog({
	open,
	onOpenChange,
	tenantId,
	template,
}: CustomVerificationDialogProps) {
	const createMutation = useCreateMixedVerificationV2Mutation();
	const updateMutation = useUpdateMixedVerificationV2Mutation();
	const isEditing = Boolean(template);
	const { countries } = useTenantSupportedCountries({
		product: "document_verification",
	});

	const form = useForm({
		defaultValues: getCustomVerificationFormValues(template),
		validators: {
			onSubmit: CustomVerificationFormSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				if (isEditing && template) {
					const payload = pickChangedFields(
						buildCustomVerificationPayload(
							getCustomVerificationFormValues(template),
						),
						buildCustomVerificationPayload(value),
					);

					if (Object.keys(payload).length === 0) {
						return;
					}

					await updateMutation.mutateAsync({
						id: template.id,
						payload,
						tenantId,
					});
					toast.success("Custom verification updated.");
				} else {
					await createMutation.mutateAsync({
						payload: {
							...buildCustomVerificationPayload(value),
							is_custom: true,
						},
						tenantId,
					});
					toast.success("Custom verification created.");
				}

				onOpenChange(false);
			} catch {
				toast.error("Failed to save custom verification.");
			}
		},
	});

	useEffect(() => {
		if (!open) {
			return;
		}

		form.reset(getCustomVerificationFormValues(template));
	}, [open, template, form]);

	const isSaving = createMutation.isPending || updateMutation.isPending;
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
				onPointerDownOutside={(event) => {
					if (isPortaledOverlayTarget(event.target)) {
						event.preventDefault();
					}
				}}
				onInteractOutside={(event) => {
					if (isPortaledOverlayTarget(event.target)) {
						event.preventDefault();
					}
				}}
				onFocusOutside={(event) => {
					if (isPortaledOverlayTarget(event.target)) {
						event.preventDefault();
					}
				}}
			>
				<DialogHeader>
					<DialogTitle className="font-semibold">
						{isEditing
							? "Edit Custom Verification"
							: "Create Custom Verification"}
					</DialogTitle>
					<DialogDescription>
						Add verification steps, configure each one, and drag to set the order
						customers complete them in.
					</DialogDescription>
				</DialogHeader>

				<form
					className="flex flex-col gap-4"
					onSubmit={(event) => {
						event.preventDefault();
						form.handleSubmit();
					}}
				>
					<FieldGroup className="flex flex-col gap-4">
						<form.Field name="name">
							{(field) => (
								<Field
									className="gap-1.5"
									data-invalid={field.state.meta.errors.length > 0}
								>
									<FieldLabel htmlFor="custom-verification-name">
										Name
									</FieldLabel>
									<Input
										id="custom-verification-name"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										placeholder="Name"
										disabled={isSaving}
										aria-invalid={field.state.meta.errors.length > 0}
									/>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							)}
						</form.Field>

						<form.Field name="description">
							{(field) => (
								<Field className="gap-1.5">
									<FieldLabel htmlFor="custom-verification-description">
										Description
									</FieldLabel>
									<Textarea
										id="custom-verification-description"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										placeholder="Description"
										rows={3}
										disabled={isSaving}
									/>
								</Field>
							)}
						</form.Field>

						<form.Field name="steps">
							{(field) => {
								const steps = field.state.value;

								function handleDragEnd(event: DragEndEvent) {
									const { active, over } = event;
									if (!over || active.id === over.id) {
										return;
									}
									const oldIndex = steps.findIndex(
										(step) => step.id === active.id,
									);
									const newIndex = steps.findIndex(
										(step) => step.id === over.id,
									);
									if (oldIndex < 0 || newIndex < 0) {
										return;
									}
									field.handleChange(arrayMove(steps, oldIndex, newIndex));
								}

								function handleAddStep(type: CustomMixedVerificationType) {
									field.handleChange([...steps, createMixedStep(type)]);
								}

								return (
									<Field
										className="gap-3"
										data-invalid={field.state.meta.errors.length > 0}
									>
										<div>
											<p className="text-sm font-medium">Verification steps</p>
											<p className="mt-1 text-xs text-muted-foreground">
												You can add the same type more than once. Configure
												each step independently.
											</p>
										</div>

										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													type="button"
													variant="outline"
													className="w-fit cursor-pointer tracking-wide"
													disabled={isSaving}
												>
													<PlusIcon className="size-4" weight="bold" />
													Add verification
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent
												align="start"
												className="z-200 w-64"
											>
												{CUSTOM_MIXED_BASE_TYPE_OPTIONS.map((type) => (
													<DropdownMenuItem
														key={type}
														className="cursor-pointer"
														onSelect={() => handleAddStep(type)}
													>
														{formatVerificationTypeLabel(type)}
													</DropdownMenuItem>
												))}
												<DropdownMenuSub>
													<DropdownMenuSubTrigger className="cursor-pointer">
														Government Registry Check
													</DropdownMenuSubTrigger>
													<DropdownMenuSubContent className="z-200 w-56">
														{MIXED_GRC_MENU_GROUPS.map((group) => (
															<DropdownMenuSub key={group.countryCode}>
																<DropdownMenuSubTrigger className="cursor-pointer">
																	{group.countryLabel}
																</DropdownMenuSubTrigger>
																<DropdownMenuSubContent className="z-200 w-64">
																	{group.types.map((item) => (
																		<DropdownMenuItem
																			key={item.value}
																			className="cursor-pointer"
																			onSelect={() =>
																				handleAddStep(item.value)
																			}
																		>
																			{item.label}
																		</DropdownMenuItem>
																	))}
																</DropdownMenuSubContent>
															</DropdownMenuSub>
														))}
													</DropdownMenuSubContent>
												</DropdownMenuSub>
											</DropdownMenuContent>
										</DropdownMenu>

										{steps.length > 0 ? (
											<DndContext
												sensors={sensors}
												collisionDetection={closestCenter}
												onDragEnd={handleDragEnd}
											>
												<SortableContext
													items={steps.map((step) => step.id)}
													strategy={verticalListSortingStrategy}
												>
													<Accordion
														key={steps.map((step) => step.id).join(":")}
														type="multiple"
														defaultValue={steps.map((step) => step.id)}
														className="flex flex-col gap-2"
													>
														{steps.map((step, index) => (
															<SortableStepCard
																key={step.id}
																step={step}
																index={index}
																disabled={isSaving}
																countries={countries}
																onRemove={() =>
																	field.handleChange(
																		steps.filter((item) => item.id !== step.id),
																	)
																}
																onChange={(next) =>
																	field.handleChange(
																		steps.map((item) =>
																			item.id === next.id ? next : item,
																		),
																	)
																}
															/>
														))}
													</Accordion>
												</SortableContext>
											</DndContext>
										) : null}
										<FieldError errors={field.state.meta.errors} />
									</Field>
								);
							}}
						</form.Field>

						<form.Field name="is_active">
							{(field) => (
								<Field className="gap-1.5">
									<div className="flex items-center gap-3">
										<Switch
											id="custom-verification-active"
											checked={field.state.value}
											onCheckedChange={(checked) =>
												field.handleChange(checked === true)
											}
											disabled={isSaving}
										/>
										<Label htmlFor="custom-verification-active">
											Template is active
										</Label>
									</div>
								</Field>
							)}
						</form.Field>
					</FieldGroup>

					<DialogFooter>
						<Button
							type="button"
							variant="ghost"
							className="cursor-pointer tracking-wide"
							disabled={isSaving}
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<form.Subscribe selector={(state) => !state.isDefaultValue}>
							{(isDirty) => (
								<Button
									type="submit"
									className="cursor-pointer tracking-wide"
									disabled={isSaving || (isEditing && !isDirty)}
								>
									{isSaving ? "Saving..." : "Save"}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
