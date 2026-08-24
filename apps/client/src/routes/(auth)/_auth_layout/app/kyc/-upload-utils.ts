import type { UploadedDocument } from "#/api/http/v1/kyc/kyc.types";
import {
	buildKycStorageFolder,
	deleteUploadedFile,
	IMAGE_UPLOAD_MIME_TYPES,
	readFileAsDataUrl,
	UPLOAD_ALLOWED_MIME_TYPES,
	UPLOAD_MAX_FILE_SIZE,
	uploadFileToStorage,
	validateUploadFile,
} from "#/lib/file-upload-storage";

export const KYC_ALLOWED_MIME_TYPES = UPLOAD_ALLOWED_MIME_TYPES;
export const KYC_SIGNATURE_MIME_TYPES = IMAGE_UPLOAD_MIME_TYPES;
export const KYC_MAX_FILE_SIZE = UPLOAD_MAX_FILE_SIZE;

export { readFileAsDataUrl };

export function validateKycFile(
	file: File,
	allowedTypes: readonly string[] = KYC_ALLOWED_MIME_TYPES,
) {
	return validateUploadFile(file, allowedTypes);
}

export function createUploadedDocument({
	file,
	url,
	folder,
	author,
	storagePath,
}: {
	file: File;
	url: string;
	folder: string;
	author?: string;
	storagePath?: string;
}): UploadedDocument {
	const resolvedStoragePath =
		storagePath ?? `${folder}/${Date.now()}-${file.name}`;

	return {
		id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
		file_name: file.name,
		file_size: file.size,
		file_type: file.type,
		uploaded_at: new Date().toISOString(),
		url,
		storage_path: resolvedStoragePath,
		author,
	};
}

export async function uploadKycFileToStorage({
	file,
	tenantId,
	tenantSlug,
	author,
	onProgress,
}: {
	file: File;
	tenantId: string;
	tenantSlug: string;
	author?: string;
	onProgress?: (progress: number) => void;
}) {
	if (!tenantId || !tenantSlug) {
		throw new Error("Tenant is required to upload files.");
	}

	const folder = buildKycStorageFolder(tenantSlug);
	const uploadedFile = await uploadFileToStorage({
		file,
		folder,
		tenantId,
		onProgress,
	});

	return createUploadedDocument({
		file,
		url: uploadedFile.url,
		folder,
		author,
		storagePath: uploadedFile.storagePath,
	});
}

export async function deleteKycFileFromStorage({
	tenantId,
	storagePath,
}: {
	tenantId: string;
	storagePath: string;
}) {
	await deleteUploadedFile({ tenantId, storagePath });
}

export function isDataUrlSignature(value: string) {
	return value.startsWith("data:image/");
}

export function isUploadedSignatureImage(value: string) {
	if (!value) {
		return false;
	}

	return isDataUrlSignature(value) || /^https?:\/\//i.test(value);
}

export function inferSignatureMethod(signature: string): "type" | "upload" {
	return isUploadedSignatureImage(signature) ? "upload" : "type";
}

export function getDocumentPreviewType(fileType: string): "pdf" | "image" {
	if (fileType === "application/pdf") {
		return "pdf";
	}

	return "image";
}
