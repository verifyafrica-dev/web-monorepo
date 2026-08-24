import type { VERIFICATION_TYPES_BY_PRODUCT } from "#/api/http/v2/verifications/verifications.types";
import { isR2UploadEnabled } from "#/lib/cloudflare-r2";
import {
	deleteFileFromR2,
	uploadFileToR2,
} from "#/lib/cloudflare-r2-storage";

export const UPLOAD_ALLOWED_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"application/pdf",
] as const;

export const IMAGE_UPLOAD_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/gif",
] as const;

export const UPLOAD_MAX_FILE_SIZE = 10 * 1024 * 1024;

export type VerificationStorageName =
	keyof typeof VERIFICATION_TYPES_BY_PRODUCT;

export interface UploadedFileResult {
	url: string;
	storagePath: string;
	fileName: string;
	fileSize: number;
	fileType: string;
}

export function validateUploadFile(
	file: File,
	allowedTypes: readonly string[] = UPLOAD_ALLOWED_MIME_TYPES,
) {
	if (file.size > UPLOAD_MAX_FILE_SIZE) {
		return {
			valid: false as const,
			error: "File size exceeds 10MB",
		};
	}

	if (!allowedTypes.includes(file.type)) {
		return {
			valid: false as const,
			error: "File type is not allowed",
		};
	}

	return { valid: true as const };
}

export function buildVerificationStorageFolder(
	tenantSlug: string,
	verificationName: VerificationStorageName,
) {
	return `tenants/${tenantSlug}/verifications/${verificationName}`;
}

export function buildKycStorageFolder(tenantSlug: string) {
	return `tenants/${tenantSlug}/kyc`;
}

export function readFileAsDataUrl(
	file: File,
	onProgress?: (progress: number) => void,
) {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();

		reader.onprogress = (event) => {
			if (!onProgress || !event.lengthComputable) {
				return;
			}

			onProgress(Math.min(100, (event.loaded / event.total) * 100));
		};

		reader.onload = () => {
			resolve(String(reader.result ?? ""));
		};
		reader.onerror = () => reject(new Error("Failed to read file"));
		reader.readAsDataURL(file);
	});
}

function buildUploadedFileResult({
	file,
	url,
	folder,
	storagePath,
}: {
	file: File;
	url: string;
	folder: string;
	storagePath?: string;
}): UploadedFileResult {
	return {
		url,
		storagePath: storagePath ?? `${folder}/${Date.now()}-${file.name}`,
		fileName: file.name,
		fileSize: file.size,
		fileType: file.type,
	};
}

function isR2UnavailableError(error: unknown) {
	if (!(error instanceof Error)) {
		return false;
	}

	return /r2 is not configured/i.test(error.message);
}

export async function uploadFileToStorage({
	file,
	folder,
	tenantId,
	onProgress,
}: {
	file: File;
	folder: string;
	tenantId: string;
	onProgress?: (progress: number) => void;
}): Promise<UploadedFileResult> {
	if (!isR2UploadEnabled()) {
		console.warn("R2 uploads disabled, using base64 data URL for upload");

		const dataUrl = await readFileAsDataUrl(file, onProgress);

		return buildUploadedFileResult({
			file,
			url: dataUrl,
			folder,
		});
	}

	try {
		const uploadResult = await uploadFileToR2(file, {
			tenantId,
			folder,
			onProgress,
		});

		return buildUploadedFileResult({
			file,
			url: uploadResult.url,
			folder,
			storagePath: uploadResult.path,
		});
	} catch (error) {
		if (!isR2UnavailableError(error)) {
			throw error;
		}

		console.warn("R2 is not configured on the server, using base64 data URL");

		const dataUrl = await readFileAsDataUrl(file, onProgress);

		return buildUploadedFileResult({
			file,
			url: dataUrl,
			folder,
		});
	}
}

export async function deleteUploadedFile({
	tenantId,
	storagePath,
}: {
	tenantId: string;
	storagePath: string;
}) {
	try {
		await deleteFileFromR2({ tenantId, filePath: storagePath });
	} catch (error) {
		if (isR2UnavailableError(error)) {
			console.warn("R2 is not configured on the server, skipping file deletion");
			return;
		}

		throw error;
	}
}
