import type { V2AxiosError } from "../http/shared";
import { UPLOADS_V2_API } from "../http/v2/uploads/uploads.api";
import type { R2PresignUploadResult } from "../http/v2/uploads/uploads.types";

export interface R2UploadOptions {
	tenantId: string;
	folder?: string;
	onProgress?: (progress: number) => void;
}

export interface R2UploadResult {
	url: string;
	path: string;
	name: string;
	size: number;
	contentType: string;
}

function getUploadErrorMessage(error: unknown) {
	const axiosError = error as V2AxiosError | null;
	const apiMessage = axiosError?.response?.data?.message;
	if (apiMessage) {
		return apiMessage;
	}

	const apiErrors = axiosError?.response?.data?.errors;
	if (apiErrors?.length) {
		return apiErrors.join(" ");
	}

	if (error instanceof Error && error.message) {
		return error.message;
	}

	return "Failed to upload file to Cloudflare R2.";
}

export function putFileToPresignedUrl({
	uploadUrl,
	file,
	headers,
	onProgress,
}: {
	uploadUrl: string;
	file: File;
	headers: Record<string, string>;
	onProgress?: (progress: number) => void;
}) {
	return new Promise<void>((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("PUT", uploadUrl);
		xhr.withCredentials = false;

		for (const [key, value] of Object.entries(headers)) {
			xhr.setRequestHeader(key, value);
		}

		xhr.upload.onprogress = (event) => {
			if (!onProgress || !event.lengthComputable || event.total <= 0) {
				return;
			}

			onProgress(Math.min(100, (event.loaded / event.total) * 100));
		};

		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				onProgress?.(100);
				resolve();
				return;
			}

			reject(
				new Error(
					`Failed to upload file to Cloudflare R2 (HTTP ${xhr.status}).`,
				),
			);
		};

		xhr.onerror = () => {
			reject(new Error("Failed to upload file to Cloudflare R2."));
		};

		xhr.send(file);
	});
}

export async function uploadFileToR2(
	file: File,
	options: R2UploadOptions,
): Promise<R2UploadResult> {
	const { tenantId, folder = "uploads", onProgress } = options;

	if (!tenantId) {
		throw new Error("Tenant is required to upload files.");
	}

	onProgress?.(0);

	const contentType = file.type || "application/octet-stream";

	let presign: R2PresignUploadResult;
	try {
		presign = await UPLOADS_V2_API.PRESIGN(tenantId, {
			file_name: file.name,
			content_type: contentType,
			folder,
			file_size: file.size,
		});
	} catch (error) {
		throw new Error(getUploadErrorMessage(error));
	}

	const putHeaders = {
		"Content-Type": contentType,
		...presign.headers,
	};

	try {
		await putFileToPresignedUrl({
			uploadUrl: presign.upload_url,
			file,
			headers: putHeaders,
			onProgress,
		});
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error("Failed to upload file to Cloudflare R2.");
	}

	return {
		url: presign.url,
		path: presign.storage_path,
		name: file.name,
		size: file.size,
		contentType,
	};
}

export async function deleteFileFromR2({
	tenantId,
	filePath,
}: {
	tenantId: string;
	filePath: string;
}): Promise<void> {
	if (!tenantId) {
		throw new Error("Tenant is required to delete files.");
	}

	try {
		await UPLOADS_V2_API.DELETE(tenantId, { storage_path: filePath });
	} catch (error) {
		throw new Error(getUploadErrorMessage(error));
	}
}
