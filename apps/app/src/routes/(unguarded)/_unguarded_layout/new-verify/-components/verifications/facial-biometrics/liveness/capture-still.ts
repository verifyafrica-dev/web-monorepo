export async function captureStillFrame(
	video: HTMLVideoElement,
	mirror: boolean,
): Promise<File> {
	const canvas = document.createElement("canvas");
	canvas.width = video.videoWidth;
	canvas.height = video.videoHeight;
	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error("Unable to capture a photo from the camera.");
	}
	if (mirror) {
		context.translate(canvas.width, 0);
		context.scale(-1, 1);
	}
	context.drawImage(video, 0, 0);
	const blob = await new Promise<Blob | null>((resolve) => {
		canvas.toBlob(resolve, "image/jpeg", 0.92);
	});
	if (!blob) {
		throw new Error("Unable to capture a photo from the camera.");
	}
	return new File([blob], "face-liveness.jpg", { type: "image/jpeg" });
}
