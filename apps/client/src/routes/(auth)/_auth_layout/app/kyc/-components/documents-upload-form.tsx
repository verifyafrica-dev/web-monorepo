import { CheckCircleIcon, InfoIcon, TrashIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type {
	KYBDocuments,
	UploadedDocument,
} from "#/api/http/v2/kyc/kyc.types";
import { useRegisterTenantComplianceDocumentV2Mutation, useDeleteTenantComplianceDocumentV2Mutation } from "#/api/http/v2/tenants/tenants.hooks";
import type { KycDocumentKey } from "#/api/http/v2/tenants/tenants.types";
import { Alert, AlertDescription } from "@verifyafrica/ui/components/ui/alert";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent, CardHeader } from "@verifyafrica/ui/components/ui/card";
import { Progress } from "@verifyafrica/ui/components/ui/progress";
import { useAuthStore } from "#/stores/auth-store";
import { KYC_DOCUMENT_CATEGORIES } from "../-constants";
import {
	deleteKycFileFromStorage,
	uploadKycFileToStorage,
	validateKycFile,
} from "../-upload-utils";
import { KycDocumentPreviewDialog } from "./kyc-document-preview-dialog";
import { KycFileUpload, KycSectionHeader } from "./kyc-form-primitives";
import { useKyc } from "./kyc-provider";

type DocumentCategoryKey = (typeof KYC_DOCUMENT_CATEGORIES)[number]["key"];

type KycUploadCallbacks = {
	onProgress: (file: File, progress: number) => void;
	onSuccess: (file: File) => void;
	onError: (file: File, error: Error) => void;
};

export function DocumentsUploadForm() {
	const {
		tenantId,
		tenantSlug,
		kycData,
		isReadOnly,
		isSaving,
		onNavigateToSection,
	} = useKyc();
	const user = useAuthStore((state) => state.user);
	const registerDocumentMutation =
		useRegisterTenantComplianceDocumentV2Mutation(tenantId);
	const deleteDocumentMutation =
		useDeleteTenantComplianceDocumentV2Mutation(tenantId);
	const documents = kycData.documents;

	const progress = useMemo(() => getDocumentCount(documents), [documents]);

	async function handleUpload(
		categoryKey: DocumentCategoryKey,
		files: File[],
		{ onProgress, onSuccess, onError }: KycUploadCallbacks,
	) {
		for (const file of files) {
			try {
				const uploadedDocument = await uploadKycFileToStorage({
					file,
					tenantId,
					tenantSlug,
					author: user?.email,
					onProgress: (progress) => onProgress(file, progress),
				});

				await registerDocumentMutation.mutateAsync({
					document_key: categoryKey as KycDocumentKey,
					url: uploadedDocument.url,
					storage_path: uploadedDocument.storage_path,
					file_name: uploadedDocument.file_name,
					file_size: uploadedDocument.file_size,
					file_type: uploadedDocument.file_type,
				});

				onSuccess(file);
				toast.success(`File uploaded successfully: ${file.name}`);
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Upload failed";
				onError(
					file,
					error instanceof Error ? error : new Error("Upload failed"),
				);
				toast.error(`Failed to upload ${file.name}: ${message}`);
			}
		}
	}

	async function handleDelete(
		categoryKey: DocumentCategoryKey,
		documentId: string,
	) {
		const document = (documents[categoryKey] ?? []).find(
			(entry) => entry.id === documentId,
		);

		try {
			if (document?.storage_path) {
				try {
					await deleteKycFileFromStorage({
						tenantId,
						storagePath: document.storage_path,
					});
				} catch {
					// Metadata removal should still proceed if storage cleanup fails.
				}
			}

			await deleteDocumentMutation.mutateAsync({
				document_key: categoryKey as KycDocumentKey,
				document_id: documentId,
			});
			toast.success("File removed");
		} catch {
			toast.error("Failed to remove file. Please try again.");
		}
	}

	async function handleContinue() {
		const incomplete = KYC_DOCUMENT_CATEGORIES.filter(
			(category) => (documents[category.key]?.length ?? 0) === 0,
		);

		if (incomplete.length > 0) {
			toast.error(
				"Please upload at least one document for each required category to continue.",
			);
			return;
		}

		onNavigateToSection(null);
	}

	const isBusy =
		isSaving ||
		registerDocumentMutation.isPending ||
		deleteDocumentMutation.isPending;

	return (
		<div className="flex flex-col gap-6">
			<KycSectionHeader
				title="Documents Upload"
				description="Upload required business and identification documents."
				badge={
					<Badge variant="outline" className="font-normal">
						{progress.percent === 100 ? "Complete" : "In Progress"} (
						{progress.percent}%)
					</Badge>
				}
			/>

			<Alert className="border-sky-200 bg-sky-50 text-sky-950">
				<InfoIcon className="size-4 text-sky-600" weight="fill" />
				<AlertDescription className="space-y-1.5 text-sky-900">
					<p>
						All document categories are required. You can upload multiple files
						per category. Accepted formats: Images (JPEG, PNG, GIF) and PDF
						documents. Maximum file size: 10MB per file.
					</p>
					<p className="flex items-center gap-2">
						<CheckCircleIcon className="size-4 shrink-0 text-sky-600" />
						Documents are automatically saved after each upload
					</p>
				</AlertDescription>
			</Alert>

			<div className="flex flex-col gap-4">
				{KYC_DOCUMENT_CATEGORIES.map((category) => (
					<DocumentCategoryCard
						key={category.key}
						categoryKey={category.key}
						title={category.title}
						description={category.description}
						documents={documents[category.key] ?? []}
						isReadOnly={isReadOnly}
						isSaving={isBusy}
						onUpload={handleUpload}
						onDelete={handleDelete}
					/>
				))}
			</div>

			{!isReadOnly && (
				<div className="flex justify-end">
					<Button
						type="button"
						className="cursor-pointer tracking-wide"
						disabled={isBusy || progress.percent !== 100}
						onClick={() => void handleContinue()}
					>
						Continue
					</Button>
				</div>
			)}
		</div>
	);
}

function getDocumentCount(documents: KYBDocuments) {
	const completed = KYC_DOCUMENT_CATEGORIES.filter(
		(category) => (documents[category.key]?.length ?? 0) > 0,
	).length;

	return {
		completed,
		total: KYC_DOCUMENT_CATEGORIES.length,
		percent: Math.round((completed / KYC_DOCUMENT_CATEGORIES.length) * 100),
	};
}

function formatFileSize(bytes: number) {
	if (bytes === 0) {
		return "0 Bytes";
	}

	const units = ["Bytes", "KB", "MB", "GB"];
	const index = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${Math.round((bytes / 1024 ** index) * 100) / 100} ${units[index]}`;
}

function formatUploadDate(isoDate: string) {
	return new Date(isoDate).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function DocumentList({
	documents,
	isReadOnly,
	onDelete,
}: {
	documents: UploadedDocument[];
	isReadOnly: boolean;
	onDelete: (documentId: string) => void;
}) {
	const [previewIndex, setPreviewIndex] = useState<number | null>(null);

	if (documents.length === 0) {
		return null;
	}

	return (
		<>
			<div className="space-y-2 border-t pt-4">
				<p className="text-sm font-medium">
					Uploaded Files ({documents.length})
				</p>
				<ul className="space-y-2">
					{documents.map((document, index) => (
						<li
							key={document.id}
							className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
						>
							<div className="min-w-0 flex-1">
								<p className="truncate font-medium">{document.file_name}</p>
								<p className="text-xs text-muted-foreground">
									{formatFileSize(document.file_size)} • Uploaded on{" "}
									{formatUploadDate(document.uploaded_at)}
								</p>
							</div>
							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant="link"
									className="h-auto p-0"
									onClick={() => setPreviewIndex(index)}
								>
									View
								</Button>
								{!isReadOnly && (
									<Button
										type="button"
										variant="ghost"
										size="icon-xs"
										onClick={() => onDelete(document.id)}
										aria-label={`Remove ${document.file_name}`}
									>
										<TrashIcon className="size-4 text-destructive" />
									</Button>
								)}
							</div>
						</li>
					))}
				</ul>
			</div>

			<KycDocumentPreviewDialog
				open={previewIndex !== null}
				onOpenChange={(open) => {
					if (!open) {
						setPreviewIndex(null);
					}
				}}
				documents={documents}
				currentIndex={previewIndex ?? 0}
				onNavigate={setPreviewIndex}
			/>
		</>
	);
}

function DocumentCategoryCard({
	categoryKey,
	title,
	description,
	documents,
	isReadOnly,
	isSaving,
	onUpload,
	onDelete,
}: {
	categoryKey: DocumentCategoryKey;
	title: string;
	description: string;
	documents: UploadedDocument[];
	isReadOnly: boolean;
	isSaving: boolean;
	onUpload: (
		categoryKey: DocumentCategoryKey,
		files: File[],
		callbacks: KycUploadCallbacks,
	) => Promise<void>;
	onDelete: (
		categoryKey: DocumentCategoryKey,
		documentId: string,
	) => Promise<void>;
}) {
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<{
		fileName: string;
		progress: number;
	} | null>(null);
	const hasFiles = documents.length > 0;

	return (
		<Card
			className={hasFiles ? "border-emerald-200 bg-emerald-50/40" : undefined}
		>
			<CardHeader className="gap-1 pb-3">
				<div className="flex flex-wrap items-center gap-2">
					<h3 className="text-base font-semibold">{title}</h3>
					{hasFiles ? (
						<Badge
							variant="outline"
							className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700 uppercase"
						>
							{documents.length} file{documents.length === 1 ? "" : "s"}
						</Badge>
					) : (
						<Badge variant="destructive" className="text-[10px] uppercase">
							Required
						</Badge>
					)}
				</div>
				<p className="text-sm text-muted-foreground">{description}</p>
			</CardHeader>
			<CardContent className="space-y-4">
				{!isReadOnly && (
					<KycFileUpload
						value={[]}
						onValueChange={() => {}}
						onFileValidate={(file) => {
							const validation = validateKycFile(file);
							return validation.valid ? undefined : validation.error;
						}}
						onFileReject={(_file, message) => {
							toast.error(message);
						}}
						onUpload={async (files, { onSuccess, onError }) => {
							setIsUploading(true);
							try {
								await onUpload(categoryKey, files, {
									onProgress: (file, progress) => {
										setUploadProgress({
											fileName: file.name,
											progress,
										});
									},
									onSuccess,
									onError,
								});
							} finally {
								setIsUploading(false);
								setUploadProgress(null);
							}
						}}
						disabled={isSaving || isUploading}
					/>
				)}

				{uploadProgress && (
					<div className="space-y-1.5">
						<div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
							<span className="truncate">Uploading {uploadProgress.fileName}</span>
							<span className="shrink-0 tabular-nums">
								{Math.round(uploadProgress.progress)}%
							</span>
						</div>
						<Progress value={uploadProgress.progress} />
					</div>
				)}

				<DocumentList
					documents={documents}
					isReadOnly={isReadOnly}
					onDelete={(documentId) => void onDelete(categoryKey, documentId)}
				/>
			</CardContent>
		</Card>
	);
}
