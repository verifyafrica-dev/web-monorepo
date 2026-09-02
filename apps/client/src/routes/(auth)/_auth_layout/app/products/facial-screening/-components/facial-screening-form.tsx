import {
	LinkIcon,
	MagnifyingGlassIcon,
	PaperPlaneTiltIcon,
	InfoIcon,
} from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Checkbox } from "@verifyafrica/ui/components/ui/checkbox";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";
import { Textarea } from "@verifyafrica/ui/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@verifyafrica/ui/components/ui/toggle-group";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@verifyafrica/ui/components/ui/tooltip";
import { cn } from "@verifyafrica/ui/lib/utils";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";
import { VerificationConsentCheckbox } from "../../../-components/VerificationConsentCheckbox";
import { ProductProofUpload } from "../../-components/product-proof-upload";
import { VerificationResultDialog } from "../../-components/verification-result-dialog";
import { useProductVerificationSubmit } from "../../-use-product-verification-submit";
import { PRODUCT_UPLOAD_VERIFICATIONS } from "../../-upload-utils";
import {
	DEFAULT_VERIFICATION_URL_LIMIT,
	VERIFICATION_MODES,
	VERIFICATION_URL_LIMITS,
	type VerificationMode,
	verificationConsentSchema,
} from "../../../-components/VerificationConsentCheckbox/data";
import {
	DEFAULT_FACE_VERIFICATION_MODE,
	FACE_AGE_MIN_YEARS,
	FACE_VERIFICATION_MODES,
	FACIAL_PROOF_MAX_BYTES,
	FACIAL_PROOF_MIME_TYPES,
	type FaceVerificationMode,
} from "../-data";
import {
	buildFacialScreeningDirectPayload,
	buildFacialScreeningLinkPayload,
} from "../-payload";

const optionalAgeSchema = z.string().trim();

const linkFormSchema = z
	.object({
		email: z.email("Enter a valid email address"),
		faceVerificationMode: z.enum(["image", "video"]),
		urlLimit: z.string().min(1, "Select a verification URL limit"),
		checkForDuplicates: z.boolean(),
		ageMin: optionalAgeSchema,
		ageMax: optionalAgeSchema,
		verificationInstructions: z.string(),
		consent: verificationConsentSchema,
	})
	.superRefine((value, context) => {
		const min = value.ageMin.trim();
		const max = value.ageMax.trim();
		if (!min && !max) {
			return;
		}
		if (!min || !max) {
			context.addIssue({
				code: "custom",
				path: min ? ["ageMax"] : ["ageMin"],
				message: "Set both a minimum and maximum age, or leave both empty.",
			});
			return;
		}
		const minAge = Number(min);
		const maxAge = Number(max);
		if (
			!Number.isInteger(minAge) ||
			!Number.isInteger(maxAge) ||
			maxAge < 0
		) {
			context.addIssue({
				code: "custom",
				path: ["ageMin"],
				message: "Age bounds must be whole numbers.",
			});
			return;
		}
		if (minAge < FACE_AGE_MIN_YEARS) {
			context.addIssue({
				code: "custom",
				path: ["ageMin"],
				message: `Minimum detected age must be ${FACE_AGE_MIN_YEARS} or greater.`,
			});
			return;
		}
		if (minAge > maxAge) {
			context.addIssue({
				code: "custom",
				path: ["ageMin"],
				message: "Minimum age cannot be greater than maximum age.",
			});
		}
	});

const directFormSchema = z.object({
	email: z.email("Enter a valid email address"),
	consent: verificationConsentSchema,
});

export function FacialScreeningForm() {
	const [mode, setMode] = useState<VerificationMode>("link");
	const [facePhotoUrl, setFacePhotoUrl] = useState<string | null>(null);
	const [isProofUploading, setIsProofUploading] = useState(false);
	const {
		submitVerification,
		linkResult,
		verificationResult,
		isResultDialogOpen,
		setIsResultDialogOpen,
		isSubmitting,
		handleStartNewVerification,
	} = useProductVerificationSubmit({
		errorMessage: "Failed to submit facial screening verification.",
	});

	const linkForm = useForm({
		defaultValues: {
			email: "",
			faceVerificationMode: DEFAULT_FACE_VERIFICATION_MODE,
			urlLimit: DEFAULT_VERIFICATION_URL_LIMIT,
			checkForDuplicates: false,
			ageMin: "",
			ageMax: "",
			verificationInstructions: "",
			consent: false,
		},
		validators: {
			onChange: linkFormSchema,
			onSubmit: linkFormSchema,
		},
		onSubmit: async ({ value }) => {
			const submitted = await submitVerification(
				buildFacialScreeningLinkPayload(value),
				{
					mode: "link",
					email: value.email,
					urlLimit: value.urlLimit,
				},
			);

			if (submitted) {
				resetForms();
			}
		},
	});

	const directForm = useForm({
		defaultValues: {
			email: "",
			consent: false,
		},
		validators: {
			onChange: directFormSchema,
			onSubmit: directFormSchema,
		},
		onSubmit: async ({ value }) => {
			if (!facePhotoUrl) {
				toast.error("Please upload a face photo or PDF");
				return;
			}

			const submitted = await submitVerification(
				buildFacialScreeningDirectPayload(value, facePhotoUrl),
				{ mode: "direct" },
			);

			if (submitted) {
				resetForms();
			}
		},
	});

	function resetForms() {
		linkForm.reset();
		directForm.reset();
		setFacePhotoUrl(null);
		setIsProofUploading(false);
	}

	const activeForm = mode === "link" ? linkForm : directForm;

	return (
		<Card>
			<CardContent className="pt-0">
				<form
					className="flex flex-col gap-6"
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						void activeForm.handleSubmit();
					}}
				>
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-sm font-medium text-muted-foreground">Mode</p>
						<ToggleGroup
							type="single"
							value={mode}
							onValueChange={(value) => {
								if (value) {
									setMode(value as VerificationMode);
								}
							}}
							variant="outline"
							spacing={0}
							className="w-full sm:w-auto"
						>
							{VERIFICATION_MODES.map((option) => {
								const Icon =
									option.value === "link" ? LinkIcon : MagnifyingGlassIcon;

								return (
									<ToggleGroupItem
										key={option.value}
										value={option.value}
										className={cn("flex-1 sm:flex-none")}
									>
										<Icon className="size-4" />
										{option.label}
									</ToggleGroupItem>
								);
							})}
						</ToggleGroup>
					</div>

					{mode === "link" ? (
						<FieldGroup className="gap-4">
							<linkForm.Field name="email">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="facial-screening-link-email">
											Email Address
										</FieldLabel>
										<Input
											id="facial-screening-link-email"
											type="email"
											autoComplete="email"
											placeholder="Email Address"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
										/>
									</Field>
								)}
							</linkForm.Field>

							<linkForm.Field name="faceVerificationMode">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="facial-screening-link-face-mode">
											Face Verification Mode
										</FieldLabel>
										<Select
											value={field.state.value}
											onValueChange={(value) =>
												field.handleChange(value as FaceVerificationMode)
											}
										>
											<SelectTrigger
												id="facial-screening-link-face-mode"
												className="w-full"
											>
												<SelectValue placeholder="Select mode" />
											</SelectTrigger>
											<SelectContent>
												{FACE_VERIFICATION_MODES.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FieldDescription>
											Image only captures a still after a blink. Video only
											records two random liveness actions.
										</FieldDescription>
									</Field>
								)}
							</linkForm.Field>

							<linkForm.Field name="checkForDuplicates">
								{(field) => (
									<Field className="gap-1.5">
										<div className="flex items-center gap-2">
											<Checkbox
												id="facial-screening-check-duplicates"
												checked={field.state.value}
												onCheckedChange={(checked) =>
													field.handleChange(checked === true)
												}
											/>
											<Label
												htmlFor="facial-screening-check-duplicates"
												className="text-sm font-normal"
											>
												Check for duplicates
											</Label>
											<Tooltip>
												<TooltipTrigger
													type="button"
													className="inline-flex text-muted-foreground"
													aria-label="About duplicate checks"
												>
													<InfoIcon className="size-4" />
												</TooltipTrigger>
												<TooltipContent>
													We will check this face against other customers to
													ensure there are no duplicate identities.
												</TooltipContent>
											</Tooltip>
										</div>
									</Field>
								)}
							</linkForm.Field>

							<div className="grid gap-4 sm:grid-cols-2">
								<linkForm.Field name="ageMin">
									{(field) => (
										<Field className="gap-1.5">
											<FieldLabel htmlFor="facial-screening-age-min">
												Minimum detected age
											</FieldLabel>
											<Input
												id="facial-screening-age-min"
												inputMode="numeric"
												min={FACE_AGE_MIN_YEARS}
												placeholder={`${FACE_AGE_MIN_YEARS}+`}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
											/>
											<FieldError errors={field.state.meta.errors} />
										</Field>
									)}
								</linkForm.Field>
								<linkForm.Field name="ageMax">
									{(field) => (
										<Field className="gap-1.5">
											<FieldLabel htmlFor="facial-screening-age-max">
												Maximum detected age
											</FieldLabel>
											<Input
												id="facial-screening-age-max"
												inputMode="numeric"
												min={FACE_AGE_MIN_YEARS}
												placeholder="Optional"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
											/>
											<FieldError errors={field.state.meta.errors} />
										</Field>
									)}
								</linkForm.Field>
							</div>
							<FieldDescription>
								Leave both empty to skip the age check. If you set a range,
								minimum age must be {FACE_AGE_MIN_YEARS} or greater, and the
								detected age from the face must fall between these bounds.
							</FieldDescription>

							<linkForm.Field name="verificationInstructions">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="facial-screening-instructions">
											Verification instructions
										</FieldLabel>
										<Textarea
											id="facial-screening-instructions"
											placeholder="Optional instructions shown to the end user"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
										/>
									</Field>
								)}
							</linkForm.Field>

							<linkForm.Field name="urlLimit">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="facial-screening-url-limit">
											Verification URL Limit
										</FieldLabel>
										<Select
											value={field.state.value}
											onValueChange={field.handleChange}
										>
											<SelectTrigger
												id="facial-screening-url-limit"
												className="w-full"
											>
												<SelectValue placeholder="Select duration" />
											</SelectTrigger>
											<SelectContent>
												{VERIFICATION_URL_LIMITS.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FieldDescription>
											How long the verification link stays active
										</FieldDescription>
									</Field>
								)}
							</linkForm.Field>
						</FieldGroup>
					) : (
						<FieldGroup className="gap-4">
							<directForm.Field name="email">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="facial-screening-direct-email">
											Email Address
										</FieldLabel>
										<Input
											id="facial-screening-direct-email"
											type="email"
											autoComplete="email"
											placeholder="Email Address"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
										/>
									</Field>
								)}
							</directForm.Field>

							<ProductProofUpload
								label="Face proof"
								verificationName={PRODUCT_UPLOAD_VERIFICATIONS.facialScreening}
								proofUrl={facePhotoUrl}
								onProofUrlChange={setFacePhotoUrl}
								onUploadingChange={setIsProofUploading}
								accept="image/jpeg,image/jpg,image/png,application/pdf"
								allowedMimeTypes={FACIAL_PROOF_MIME_TYPES}
								maxSize={FACIAL_PROOF_MAX_BYTES}
								emptyStateText="Upload a JPEG, PNG, or PDF up to 16MB"
								disabled={isSubmitting}
							/>
						</FieldGroup>
					)}

					{mode === "link" ? (
						<linkForm.Field name="consent">
							{(field) => (
								<VerificationConsentCheckbox
									id="facial-screening-link-consent"
									checked={field.state.value}
									onCheckedChange={field.handleChange}
								/>
							)}
						</linkForm.Field>
					) : (
						<directForm.Field name="consent">
							{(field) => (
								<VerificationConsentCheckbox
									id="facial-screening-direct-consent"
									checked={field.state.value}
									onCheckedChange={field.handleChange}
								/>
							)}
						</directForm.Field>
					)}

					{mode === "link" ? (
						<linkForm.Subscribe selector={(state) => state.canSubmit}>
							{(canSubmit) => (
								<Button
									type="submit"
									className="w-full cursor-pointer"
									disabled={!canSubmit || isSubmitting}
								>
									<PaperPlaneTiltIcon className="size-4" />
									{isSubmitting ? "Submitting..." : "Submit Verification"}
								</Button>
							)}
						</linkForm.Subscribe>
					) : (
						<directForm.Subscribe selector={(state) => state.canSubmit}>
							{(canSubmit) => (
								<Button
									type="submit"
									className="w-full cursor-pointer"
									disabled={
										!canSubmit ||
										!facePhotoUrl ||
										isProofUploading ||
										isSubmitting
									}
								>
									<PaperPlaneTiltIcon className="size-4" />
									{isSubmitting ? "Submitting..." : "Submit Verification"}
								</Button>
							)}
						</directForm.Subscribe>
					)}
				</form>
			</CardContent>

			<VerificationResultDialog
				open={isResultDialogOpen}
				onOpenChange={setIsResultDialogOpen}
				linkResult={linkResult}
				verification={verificationResult}
				onStartNew={() => handleStartNewVerification(resetForms)}
				description="Your facial screening verification request was created successfully."
			/>
		</Card>
	);
}
