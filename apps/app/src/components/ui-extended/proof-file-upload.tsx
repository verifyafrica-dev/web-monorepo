import {
	CloudArrowUpIcon,
	type Icon,
	type IconWeight,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	FileUpload,
	FileUploadDropzone,
	FileUploadItem,
	FileUploadItemDelete,
	FileUploadItemMetadata,
	FileUploadItemPreview,
	FileUploadList,
	FileUploadTrigger,
} from "@verifyafrica/ui/components/ui/file-upload";
import { Field, FieldLabel } from "@verifyafrica/ui/components/ui/field";
import {
	UPLOAD_ALLOWED_MIME_TYPES,
	UPLOAD_MAX_FILE_SIZE,
} from "@verifyafrica/api-client/lib/file-upload-storage";
import { isPasswordProtectedPdf } from "@verifyafrica/ui/lib/pdf-file";
import { cn } from "@verifyafrica/ui/lib/utils";

export type ProofFileUploadHelpers = {
	onProgress: (progress: number) => void;
};

export type ProofFileUploadProps = {
	/**
	 * Accessible field label shown above the dropzone.
	 */
	label: string;
	/**
	 * Copy shown in the empty dropzone.
	 */
	emptyStateText: string;
	/**
	 * Copy shown after a remote URL has been stored.
	 * @default "File uploaded"
	 */
	uploadedStateText?: string;
	/**
	 * Copy shown while `onUpload` is in flight.
	 * @default "Uploading..."
	 */
	uploadingStateText?: string;
	/**
	 * Label for the in-dropzone trigger button.
	 * @default "Choose file"
	 */
	triggerLabel?: string;
	/**
	 * Label for the selected-file remove action.
	 * @default "Remove"
	 */
	removeLabel?: string;
	/**
	 * Native `accept` attribute passed to the file input.
	 * @default "image/*,application/pdf"
	 */
	accept?: string;
	/**
	 * MIME types allowed after the OS picker. When omitted, JPEG, PNG, GIF, and PDF are accepted.
	 */
	allowedMimeTypes?: readonly string[];
	/**
	 * Maximum file size in bytes.
	 * @default 10485760 (10MB)
	 */
	maxSize?: number;
	/**
	 * Maximum number of files the dropzone accepts.
	 * @default 1
	 */
	maxFiles?: number;
	/**
	 * Controlled selected file. Pass `null` for an empty controlled dropzone.
	 */
	file?: File | null;
	/**
	 * Called when the selected file changes, including clears.
	 */
	onFileChange?: (file: File | null) => void;
	/**
	 * Remote URL from a completed `onUpload`. Used only for empty-state copy.
	 */
	proofUrl?: string | null;
	/**
	 * Called with the uploaded URL, or `null` when the file is removed or upload fails.
	 */
	onProofUrlChange?: (url: string | null) => void;
	/**
	 * Persist the selected file and return a public URL. Omit this to keep the file local only.
	 */
	onUpload?: (
		file: File,
		helpers: ProofFileUploadHelpers,
	) => Promise<string>;
	/**
	 * Called whenever the upload in-flight state changes.
	 */
	onUploadingChange?: (isUploading: boolean) => void;
	/**
	 * Phosphor icon rendered in the empty dropzone.
	 * @default CloudArrowUpIcon
	 */
	icon?: Icon;
	/**
	 * Phosphor weight for `icon`.
	 * @default "regular"
	 */
	iconWeight?: IconWeight;
	/**
	 * Extra classes for the dropzone icon.
	 * @default "size-8 text-muted-foreground"
	 */
	iconClassName?: string;
	/**
	 * Extra classes for the dashed dropzone.
	 */
	dropzoneClassName?: string;
	/**
	 * Extra classes for the outer field wrapper.
	 */
	className?: string;
	/**
	 * Disables picking, dropping, and removing files.
	 */
	disabled?: boolean;
};

/**
 * Single-file proof dropzone used across product forms and hosted verification.
 * Provide `onUpload` when the file should be stored remotely; otherwise the selected `File` stays local.
 */
export function ProofFileUpload({
	label,
	emptyStateText,
	uploadedStateText = "File uploaded",
	uploadingStateText = "Uploading...",
	triggerLabel = "Choose file",
	removeLabel = "Remove",
	accept = "image/*,application/pdf",
	allowedMimeTypes = UPLOAD_ALLOWED_MIME_TYPES,
	maxSize = UPLOAD_MAX_FILE_SIZE,
	maxFiles = 1,
	file,
	onFileChange,
	proofUrl = null,
	onProofUrlChange,
	onUpload,
	onUploadingChange,
	icon: Icon = CloudArrowUpIcon,
	iconWeight = "regular",
	iconClassName,
	dropzoneClassName,
	className,
	disabled = false,
}: ProofFileUploadProps) {
	const isFileControlled = file !== undefined;
	const [internalFiles, setInternalFiles] = useState<File[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const files = isFileControlled ? (file ? [file] : []) : internalFiles;
	const isDisabled = disabled || isUploading;

	useEffect(() => {
		onUploadingChange?.(isUploading);
	}, [isUploading, onUploadingChange]);

	function handleFilesChange(nextFiles: File[]) {
		if (!isFileControlled) {
			setInternalFiles(nextFiles);
		}

		onFileChange?.(nextFiles[0] ?? null);

		if (nextFiles.length === 0) {
			onProofUrlChange?.(null);
		}
	}

	return (
		<Field className={cn("gap-1.5", className)}>
			<FieldLabel>{label}</FieldLabel>
			<FileUpload
				value={files}
				onValueChange={handleFilesChange}
				accept={accept}
				maxFiles={maxFiles}
				maxSize={maxSize}
				disabled={isDisabled}
				onFileValidate={(nextFile) =>
					validateProofFile(nextFile, allowedMimeTypes, maxSize)
				}
				onFileReject={(_rejectedFile, message) => {
					toast.error(message);
				}}
				onUpload={
					onUpload
						? async (uploadFiles, { onProgress, onSuccess, onError }) => {
								const nextFile = uploadFiles[0];

								if (!nextFile) {
									onProofUrlChange?.(null);
									return;
								}

								setIsUploading(true);

								try {
									const url = await onUpload(nextFile, {
										onProgress: (progress) => {
											onProgress(nextFile, progress);
										},
									});

									onProofUrlChange?.(url);
									onSuccess(nextFile);
								} catch (error) {
									const message =
										error instanceof Error ? error.message : "Upload failed";
									onError(
										nextFile,
										error instanceof Error
											? error
											: new Error("Upload failed"),
									);
									toast.error(`Failed to upload file: ${message}`);
									handleFilesChange([]);
								} finally {
									setIsUploading(false);
								}
							}
						: undefined
				}
			>
				<FileUploadDropzone
					className={cn(
						"flex min-h-36 flex-col items-center justify-center gap-2 border-dashed py-8",
						dropzoneClassName,
					)}
				>
					<Icon
						className={cn(
							"size-8 text-muted-foreground",
							iconClassName,
						)}
						weight={iconWeight}
					/>
					<p className="text-center text-sm text-muted-foreground text-pretty">
						{isUploading
							? uploadingStateText
							: proofUrl
								? uploadedStateText
								: emptyStateText}
					</p>
					<FileUploadTrigger asChild>
						<Button
							type="button"
							variant="link"
							className="h-auto p-0"
							disabled={isDisabled}
						>
							{triggerLabel}
						</Button>
					</FileUploadTrigger>
				</FileUploadDropzone>
				{files.length > 0 ? (
					<FileUploadList className="mt-2">
						{files.map((item) => (
							<FileUploadItem
								key={`${item.name}-${item.lastModified}`}
								value={item}
								className="justify-between gap-3 p-2"
							>
								<div className="flex min-w-0 items-center gap-2.5">
									<FileUploadItemPreview className="size-8 shrink-0" />
									<FileUploadItemMetadata
										size="sm"
										className="min-w-0 flex-initial"
									/>
								</div>
								<FileUploadItemDelete asChild>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="h-8 shrink-0 px-2"
										disabled={isDisabled}
									>
										{removeLabel}
									</Button>
								</FileUploadItemDelete>
							</FileUploadItem>
						))}
					</FileUploadList>
				) : null}
			</FileUpload>
		</Field>
	);
}

async function validateProofFile(
	file: File,
	allowedMimeTypes: readonly string[],
	maxSize: number,
) {
	if (file.size > maxSize) {
		const maxMegabytes = Math.round(maxSize / (1024 * 1024));
		return `File size exceeds ${maxMegabytes}MB`;
	}

	if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.type)) {
		return "File type is not allowed";
	}

	if (await isPasswordProtectedPdf(file)) {
		return "Password-protected PDFs are not allowed";
	}

	return undefined;
}
