import { convertVideoToMp4 } from "#/server/convert-video-to-mp4";

import { isMp4MimeType } from "./media-recorder";

function blobToBase64(blob: Blob) {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result;
			if (typeof result !== "string") {
				reject(new Error("Unable to read the recorded video."));
				return;
			}
			const commaIndex = result.indexOf(",");
			resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
		};
		reader.onerror = () => {
			reject(new Error("Unable to read the recorded video."));
		};
		reader.readAsDataURL(blob);
	});
}

function base64ToFile(base64: string, fileName: string, mimeType: string) {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}
	return new File([bytes], fileName, { type: mimeType });
}

export async function ensureMp4Video(blob: Blob): Promise<File> {
	if (isMp4MimeType(blob.type)) {
		return new File([blob], "face-liveness.mp4", { type: "video/mp4" });
	}

	const converted = await convertVideoToMp4({
		data: {
			base64: await blobToBase64(blob),
			mimeType: blob.type || "video/webm",
		},
	});

	return base64ToFile(converted.base64, "face-liveness.mp4", converted.mimeType);
}
