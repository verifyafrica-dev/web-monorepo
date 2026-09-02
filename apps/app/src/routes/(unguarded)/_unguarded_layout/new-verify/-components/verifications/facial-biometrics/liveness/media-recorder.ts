const MP4_CANDIDATES = [
	'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',
	"video/mp4;codecs=avc1.42E01E",
	"video/mp4",
] as const;

const WEBM_CANDIDATES = [
	"video/webm;codecs=vp9",
	"video/webm;codecs=vp8",
	"video/webm",
] as const;

export const MAX_LIVENESS_VIDEO_BYTES = 12 * 1024 * 1024;

export function isMp4MimeType(mimeType: string) {
	return mimeType.toLowerCase().includes("mp4");
}

export function pickRecordingMimeType(): string | undefined {
	if (typeof MediaRecorder === "undefined") {
		return undefined;
	}

	const supportedMp4 = MP4_CANDIDATES.find((type) =>
		MediaRecorder.isTypeSupported(type),
	);
	if (supportedMp4) {
		return supportedMp4;
	}

	return WEBM_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
}

export class SizeCappedRecorder {
	private recorder: MediaRecorder | null = null;
	private chunks: Blob[] = [];
	private recordedBytes = 0;

	start(stream: MediaStream, mimeType: string) {
		this.chunks = [];
		this.recordedBytes = 0;
		this.recorder = new MediaRecorder(stream, { mimeType });
		this.recorder.addEventListener("dataavailable", (event) => {
			if (event.data.size === 0) {
				return;
			}
			this.recordedBytes += event.data.size;
			this.chunks.push(event.data);
		});
		this.recorder.start(400);
	}

	get byteLength() {
		return this.recordedBytes;
	}

	hasExceededCap() {
		return this.recordedBytes >= MAX_LIVENESS_VIDEO_BYTES;
	}

	stop(): Promise<Blob> {
		const recorder = this.recorder;
		if (!recorder || recorder.state === "inactive") {
			return Promise.resolve(
				new Blob(this.chunks, { type: recorder?.mimeType ?? "video/webm" }),
			);
		}

		return new Promise((resolve, reject) => {
			recorder.addEventListener(
				"error",
				() => {
					reject(new Error("Video recording failed."));
				},
				{ once: true },
			);
			recorder.addEventListener(
				"stop",
				() => {
					resolve(
						new Blob(this.chunks, {
							type: recorder.mimeType || "video/webm",
						}),
					);
				},
				{ once: true },
			);
			recorder.stop();
		});
	}
}
