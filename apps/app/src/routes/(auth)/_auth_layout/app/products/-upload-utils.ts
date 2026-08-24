import {
	buildVerificationStorageFolder,
	IMAGE_UPLOAD_MIME_TYPES,
	UPLOAD_ALLOWED_MIME_TYPES,
	UPLOAD_MAX_FILE_SIZE,
	uploadFileToStorage,
	validateUploadFile,
	type VerificationStorageName,
} from "#/lib/file-upload-storage";

export const PRODUCT_UPLOAD_VERIFICATIONS = {
	documentVerification: "Document Verification",
	addressVerification: "Address Verification",
	facialScreening: "Facial Screening",
	governmentRegistryChecks: "Government Registry Checks",
} as const satisfies Record<string, VerificationStorageName>;

export type ProductUploadVerification =
	(typeof PRODUCT_UPLOAD_VERIFICATIONS)[keyof typeof PRODUCT_UPLOAD_VERIFICATIONS];

export {
	IMAGE_UPLOAD_MIME_TYPES,
	UPLOAD_ALLOWED_MIME_TYPES,
	UPLOAD_MAX_FILE_SIZE,
	validateUploadFile,
	type VerificationStorageName,
};

export async function uploadProductProofFile({
	file,
	tenantId,
	tenantSlug,
	verificationName,
	onProgress,
}: {
	file: File;
	tenantId: string;
	tenantSlug: string;
	verificationName: VerificationStorageName;
	onProgress?: (progress: number) => void;
}) {
	if (!tenantId || !tenantSlug) {
		throw new Error("Tenant is required to upload files.");
	}

	const uploadedFile = await uploadFileToStorage({
		file,
		folder: buildVerificationStorageFolder(tenantSlug, verificationName),
		tenantId,
		onProgress,
	});

	return uploadedFile.url;
}
