import { createServerFn } from "@tanstack/react-start";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

const CORE_BASE = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";

type ConvertVideoInput = {
	base64: string;
	mimeType: string;
};

function extensionForMime(mimeType: string) {
	if (mimeType.includes("webm")) {
		return "webm";
	}
	if (mimeType.includes("mp4")) {
		return "mp4";
	}
	return "video";
}

export const convertVideoToMp4 = createServerFn({ method: "POST" })
	.validator((input: ConvertVideoInput) => input)
	.handler(async ({ data }) => {
		const ffmpeg = new FFmpeg();
		await ffmpeg.load({
			coreURL: `${CORE_BASE}/ffmpeg-core.js`,
			wasmURL: `${CORE_BASE}/ffmpeg-core.wasm`,
		});

		const inputName = `input.${extensionForMime(data.mimeType)}`;
		const bytes = await fetchFile(
			new Blob([Buffer.from(data.base64, "base64")], { type: data.mimeType }),
		);
		await ffmpeg.writeFile(inputName, bytes);
		const exitCode = await ffmpeg.exec([
			"-i",
			inputName,
			"-c:v",
			"libx264",
			"-pix_fmt",
			"yuv420p",
			"-movflags",
			"+faststart",
			"-an",
			"output.mp4",
		]);
		if (exitCode !== 0) {
			throw new Error("Unable to convert the recording to MP4.");
		}

		const output = await ffmpeg.readFile("output.mp4");
		if (typeof output === "string") {
			throw new Error("Unable to convert the recording to MP4.");
		}

		const binary = output instanceof Uint8Array ? output : new Uint8Array(output);
		return {
			mimeType: "video/mp4",
			base64: Buffer.from(binary).toString("base64"),
		};
	});
