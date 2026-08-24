import { NEW_VERIFY_V2_API } from "#/api/http/v2/verifications/new-verify/new-verify.api";
import { putFileToPresignedUrl } from "#/lib/cloudflare-r2-storage";

function getProofContentType(file: File) {
	const type = file.type.trim().toLowerCase();

	if (type === "image/jpg") {
		return "image/jpeg";
	}

	if (type) {
		return type;
	}

	const name = file.name.toLowerCase();

	if (name.endsWith(".png")) {
		return "image/png";
	}

	if (name.endsWith(".pdf")) {
		return "application/pdf";
	}

	return "image/jpeg";
}

export async function uploadNewVerifyProofFile(token: string, file: File) {
	const contentType = getProofContentType(file);
	const presign = await NEW_VERIFY_V2_API.PRESIGN(token, {
		file_name: file.name,
		content_type: contentType,
		file_size: file.size,
	});

	await putFileToPresignedUrl({
		uploadUrl: presign.upload_url,
		file,
		headers: {
			"Content-Type": contentType,
			...presign.headers,
		},
	});

	return presign.url;
}
