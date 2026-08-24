import { useForm } from "@tanstack/react-form";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
	KycAuthorizedSignatureFormSchema,
	type KycAuthorizedSignatureFormValues,
} from "#/api/http/v2/kyc/kyc.types";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import { Progress } from "@verifyafrica/ui/components/ui/progress";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";
import { useAuthStore } from "#/stores/auth-store";
import {
	KYC_SIGNATURE_METHODS,
	type KycSignatureMethod,
} from "../-constants";
import { SECTION_NAMES } from "../-data";
import {
	inferSignatureMethod,
	isUploadedSignatureImage,
	KYC_SIGNATURE_MIME_TYPES,
	uploadKycFileToStorage,
	validateKycFile,
} from "../-upload-utils";
import { useKyc } from "./kyc-provider";
import {
	Input,
	KycDatePicker,
	KycFileUpload,
	KycSaveButton,
	KycSectionHeader,
} from "./kyc-form-primitives";

function getDefaultValues(
	kycData: ReturnType<typeof useKyc>["kycData"],
): KycAuthorizedSignatureFormValues {
	return {
		full_name: kycData.authorized_signature?.full_name ?? "",
		position_title: kycData.authorized_signature?.position_title ?? "",
		date: format(new Date(), "yyyy-MM-dd"),
		signature: kycData.authorized_signature?.signature ?? "",
	};
}

export function AuthorizedSignatureForm() {
	const { tenantId, tenantSlug, kycData, isReadOnly, isSaving, saveSection } =
		useKyc();
	const user = useAuthStore((state) => state.user);
	const [signatureMethod, setSignatureMethod] = useState<KycSignatureMethod>(
		() =>
			inferSignatureMethod(kycData.authorized_signature?.signature ?? ""),
	);
	const [uploadFiles, setUploadFiles] = useState<File[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<{
		fileName: string;
		progress: number;
	} | null>(null);

	const form = useForm({
		defaultValues: getDefaultValues(kycData),
		validators: {
			onSubmit: KycAuthorizedSignatureFormSchema,
		},
		onSubmit: async ({ value }) => {
			await saveSection("authorized-signature", value, {
				currentSection: SECTION_NAMES.AUTHORIZED_SIGNATURE,
			});
		},
	});

	useEffect(() => {
		form.reset(getDefaultValues(kycData));
		setSignatureMethod(
			inferSignatureMethod(kycData.authorized_signature?.signature ?? ""),
		);
		setUploadFiles([]);
	}, [form, kycData]);

	function handleSignatureMethodChange(method: KycSignatureMethod) {
		setSignatureMethod(method);
		setUploadFiles([]);
		form.setFieldValue("signature", "");
	}

	return (
		<form
			className="flex flex-col gap-6"
			onSubmit={(event) => {
				event.preventDefault();
				form.handleSubmit();
			}}
		>
			<KycSectionHeader
				title="Authorized Signature"
				description="Provide your authorized signature."
			/>

			<FieldGroup>
				<form.Field name="full_name">
					{(field) => (
						<Field
							data-invalid={field.state.meta.errors.length > 0}
							className="gap-1.5"
						>
							<FieldLabel htmlFor="signatoryName">
								Full Name <span className="text-destructive">*</span>
							</FieldLabel>
							<Input
								id="signatoryName"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								placeholder="Enter the full name of the authorized signatory"
								disabled={isReadOnly}
							/>
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				</form.Field>

				<form.Field name="position_title">
					{(field) => (
						<Field
							data-invalid={field.state.meta.errors.length > 0}
							className="gap-1.5"
						>
							<FieldLabel htmlFor="signatoryPosition">
								Position Title <span className="text-destructive">*</span>
							</FieldLabel>
							<Input
								id="signatoryPosition"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								placeholder="Enter the position title of the authorized signatory"
								disabled={isReadOnly}
							/>
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				</form.Field>

				<form.Field name="date">
					{(field) => (
						<Field
							data-invalid={field.state.meta.errors.length > 0}
							className="gap-1.5"
						>
							<FieldLabel htmlFor="signatureDate">Date</FieldLabel>
							<KycDatePicker
								id="signatureDate"
								value={field.state.value}
								onChange={(date) =>
									field.handleChange(date ? format(date, "yyyy-MM-dd") : "")
								}
								disabled
							/>
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				</form.Field>

				<Field className="gap-1.5">
					<FieldLabel htmlFor="signatureMethod">
						Signature Method <span className="text-destructive">*</span>
					</FieldLabel>
					<Select
						value={signatureMethod}
						onValueChange={(value) =>
							handleSignatureMethodChange(value as KycSignatureMethod)
						}
						disabled={isReadOnly}
					>
						<SelectTrigger id="signatureMethod" className="w-full">
							<SelectValue placeholder="Select signature method" />
						</SelectTrigger>
						<SelectContent>
							{KYC_SIGNATURE_METHODS.map((method) => (
								<SelectItem key={method.value} value={method.value}>
									{method.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>

				<form.Field name="signature">
					{(field) => (
						<Field
							data-invalid={field.state.meta.errors.length > 0}
							className="gap-1.5"
						>
							<FieldLabel htmlFor="signature">
								Signature <span className="text-destructive">*</span>
							</FieldLabel>
							<p className="text-sm text-muted-foreground">
								Please provide your signature using the selected method
							</p>

							{signatureMethod === "type" ? (
								<Input
									id="signature"
									value={
										isUploadedSignatureImage(field.state.value)
											? ""
											: field.state.value
									}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									placeholder="Type your signature (e.g., John Smith)"
									className="font-[family-name:var(--font-signature,cursive)] text-lg italic"
									disabled={isReadOnly}
								/>
							) : (
								<div className="space-y-3">
									<KycFileUpload
										value={uploadFiles}
										onValueChange={setUploadFiles}
										onFileValidate={(file) => {
											const validation = validateKycFile(
												file,
												KYC_SIGNATURE_MIME_TYPES,
											);
											return validation.valid
												? undefined
												: validation.error;
										}}
										onFileReject={(_file, message) => {
											toast.error(message);
										}}
										onUpload={async (
											files,
											{ onProgress, onSuccess, onError },
										) => {
											const file = files[0];
											if (!file) {
												form.setFieldValue("signature", "");
												return;
											}

											setIsUploading(true);
											try {
												const uploadedDocument =
													await uploadKycFileToStorage({
														file,
														tenantId,
														tenantSlug,
														author: user?.email,
														onProgress: (progress) => {
															setUploadProgress({
																fileName: file.name,
																progress,
															});
															onProgress(file, progress);
														},
													});

												form.setFieldValue(
													"signature",
													uploadedDocument.url,
												);
												onSuccess(file);
											} catch (error) {
												const message =
													error instanceof Error
														? error.message
														: "Upload failed";
												onError(
													file,
													error instanceof Error
														? error
														: new Error("Upload failed"),
												);
												toast.error(
													`Failed to upload signature: ${message}`,
												);
												setUploadFiles([]);
												form.setFieldValue("signature", "");
											} finally {
												setIsUploading(false);
												setUploadProgress(null);
												setUploadFiles([]);
											}
										}}
										accept="image/jpeg,image/png,image/gif"
										multiple={false}
										disabled={isReadOnly || isUploading}
									/>
									{uploadProgress && (
										<div className="space-y-1.5">
											<div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
												<span className="truncate">
													Uploading {uploadProgress.fileName}
												</span>
												<span className="shrink-0 tabular-nums">
													{Math.round(uploadProgress.progress)}%
												</span>
											</div>
											<Progress value={uploadProgress.progress} />
										</div>
									)}
									{isUploadedSignatureImage(field.state.value) && (
										<div className="rounded-lg border bg-muted/30 p-4">
											<p className="mb-2 text-xs font-medium text-muted-foreground">
												Signature preview
											</p>
											<img
												src={field.state.value}
												alt="Uploaded signature"
												className="max-h-32 object-contain"
											/>
										</div>
									)}
								</div>
							)}

							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				</form.Field>
			</FieldGroup>

			{!isReadOnly && <KycSaveButton isSaving={isSaving} />}
		</form>
	);
}
