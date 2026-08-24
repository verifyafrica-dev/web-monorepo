export type R2PresignUploadPayload = {
	file_name: string;
	content_type: string;
	folder: string;
	file_size: number;
};

export type R2PresignUploadResult = {
	upload_url: string;
	storage_path: string;
	url: string;
	expires_in: number;
	headers: Record<string, string>;
};

export type R2DeleteUploadPayload = {
	storage_path: string;
};

export type R2DeleteUploadResult = {
	storage_path: string;
	deleted: boolean;
};
