import {
	LinkIcon,
	MagnifyingGlassIcon,
	PaperPlaneTiltIcon,
} from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Input } from "@verifyafrica/ui/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@verifyafrica/ui/components/ui/toggle-group";
import { cn } from "#/lib/utils.ts";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";
import { VerificationConsentCheckbox } from "../../../-components/VerificationConsentCheckbox";
import { ProductProofUpload } from "../../-components/product-proof-upload";
import { VerificationResultDialog } from "../../-components/verification-result-dialog";
import { useProductVerificationSubmit } from "../../-use-product-verification-submit";
import {
	IMAGE_UPLOAD_MIME_TYPES,
	PRODUCT_UPLOAD_VERIFICATIONS,
} from "../../-upload-utils";
import {
	DEFAULT_VERIFICATION_URL_LIMIT,
	VERIFICATION_MODES,
	VERIFICATION_URL_LIMITS,
	type VerificationMode,
	verificationConsentSchema,
} from "../../../-components/VerificationConsentCheckbox/data";
import {
	DEFAULT_FACE_VERIFICATION_MODE,
	FACE_VERIFICATION_MODES,
	type FaceVerificationMode,
} from "../-data";
import {
	buildFacialScreeningDirectPayload,
	buildFacialScreeningLinkPayload,
} from "../-payload";

const linkFormSchema = z.object({
	email: z.email("Enter a valid email address"),
	faceVerificationMode: z.enum(["any", "image", "video"]),
	urlLimit: z.string().min(1, "Select a verification URL limit"),
	consent: verificationConsentSchema,
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
				toast.error("Please upload a face photo");
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

							<Field className="gap-1.5">
								<FieldLabel htmlFor="facial-screening-direct-face-mode">
									Face Verification Mode
								</FieldLabel>
								<Select value={DEFAULT_FACE_VERIFICATION_MODE} disabled>
									<SelectTrigger
										id="facial-screening-direct-face-mode"
										className="w-full"
									>
										<SelectValue />
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
									Fixed to &apos;Any&apos; in direct mode
								</FieldDescription>
							</Field>

							<ProductProofUpload
								label="Face Photo"
								verificationName={PRODUCT_UPLOAD_VERIFICATIONS.facialScreening}
								proofUrl={facePhotoUrl}
								onProofUrlChange={setFacePhotoUrl}
								onUploadingChange={setIsProofUploading}
								accept="image/*"
								allowedMimeTypes={IMAGE_UPLOAD_MIME_TYPES}
								emptyStateText="Click to upload a face photo"
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
