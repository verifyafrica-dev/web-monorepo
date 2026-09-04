import { RecordIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ProofFileUpload } from "#/components/ui-extended/proof-file-upload";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@verifyafrica/ui/components/ui/dialog";
import { Spinner } from "@verifyafrica/ui/components/ui/spinner";

import { captureStillFrame } from "./liveness/capture-still";
import { ensureMp4Video } from "./liveness/ensure-mp4";
import { FACE_OVAL, isFaceInOval } from "./liveness/face-in-oval";
import { createFaceLandmarker, detectFace } from "./liveness/landmarker";
import {
	MAX_LIVENESS_VIDEO_BYTES,
	pickRecordingMimeType,
	SizeCappedRecorder,
} from "./liveness/media-recorder";
import { LivenessChallengeTracker } from "./liveness/tracker";

const FACIAL_PROOF_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"application/pdf",
] as const;
const FACIAL_PROOF_MAX_BYTES = 16 * 1024 * 1024;
const IMAGE_CAPTURE_DELAY_MS = 200;
const VIDEO_RECORDING_MS = 5000;
const VIDEO_RECORDING_SECONDS = VIDEO_RECORDING_MS / 1000;

type CaptureMode = "requesting" | "camera" | "upload";
type FailureReason = "unsupported" | "left_oval" | "too_long" | "generic";

type FacialCaptureProps = {
	verificationMode: "image_only" | "video_only";
	allowFileUpload: boolean;
	isSubmitting?: boolean;
	onComplete: (file: File) => void | Promise<void>;
};

function stopMediaStream(stream: MediaStream | null) {
	stream?.getTracks().forEach((track) => {
		track.stop();
	});
}

function getTrackZoomRange(track: MediaStreamTrack) {
	const capabilities = track.getCapabilities?.() as
		| (MediaTrackCapabilities & { zoom?: { min?: number; max?: number } })
		| undefined;
	const zoom = capabilities?.zoom;
	if (!zoom || typeof zoom !== "object") {
		return null;
	}

	const min = "min" in zoom && typeof zoom.min === "number" ? zoom.min : undefined;
	const max = "max" in zoom && typeof zoom.max === "number" ? zoom.max : undefined;
	if (min === undefined && max === undefined) {
		return null;
	}

	return { min: min ?? 1, max: max ?? 1 };
}

async function lockCameraToDefaultZoom(stream: MediaStream) {
	const track = stream.getVideoTracks()[0];
	if (!track) {
		return;
	}

	const range = getTrackZoomRange(track);
	if (!range) {
		return;
	}

	const zoom = Math.min(range.max, Math.max(range.min, 1));
	try {
		await track.applyConstraints({
			advanced: [{ zoom } as MediaTrackConstraintSet],
		});
	} catch {
		// Safari and some Android browsers ignore or reject zoom constraints.
	}
}

export function FacialCapture({
	verificationMode,
	allowFileUpload,
	isSubmitting = false,
	onComplete,
}: FacialCaptureProps) {
	const [mode, setMode] = useState<CaptureMode>("requesting");
	const [prompt, setPrompt] = useState("Align your face in the oval.");
	const [failure, setFailure] = useState<FailureReason | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [attempt, setAttempt] = useState(0);
	const [canRecord, setCanRecord] = useState(false);
	const [isRecording, setIsRecording] = useState(false);
	const [secondsLeft, setSecondsLeft] = useState(VIDEO_RECORDING_SECONDS);
	const videoRef = useRef<HTMLVideoElement>(null);
	const overlayRef = useRef<HTMLDivElement>(null);
	const lastTimestampRef = useRef(-1);
	const streamRef = useRef<MediaStream | null>(null);
	const landmarkerRef = useRef<Awaited<
		ReturnType<typeof createFaceLandmarker>
	> | null>(null);
	const trackerRef = useRef(new LivenessChallengeTracker());
	const recorderRef = useRef<SizeCappedRecorder | null>(null);
	const startedRef = useRef(false);
	const completingRef = useRef(false);
	const rafRef = useRef(0);
	const isRecordingRef = useRef(false);
	const recordTimeoutRef = useRef(0);
	const recordIntervalRef = useRef(0);

	const isVideoMode = verificationMode === "video_only";
	const isBusy = isProcessing || isSubmitting;

	const failCapture = useCallback(async (reason: FailureReason) => {
		window.cancelAnimationFrame(rafRef.current);
		window.clearTimeout(recordTimeoutRef.current);
		window.clearInterval(recordIntervalRef.current);
		isRecordingRef.current = false;
		setIsRecording(false);
		setCanRecord(false);
		if (recorderRef.current) {
			await recorderRef.current.stop().catch(() => undefined);
			recorderRef.current = null;
		}
		setFailure(reason);
	}, []);

	const finishCapture = useCallback(
		async (video: HTMLVideoElement) => {
			setIsProcessing(true);
			try {
				if (isVideoMode) {
					window.clearTimeout(recordTimeoutRef.current);
					window.clearInterval(recordIntervalRef.current);
					isRecordingRef.current = false;
					setIsRecording(false);
					video.pause();
					const recorder = recorderRef.current;
					if (!recorder) {
						throw new Error("Recording did not start.");
					}
					const blob = await recorder.stop();
					recorderRef.current = null;
					if (blob.size > MAX_LIVENESS_VIDEO_BYTES) {
						setFailure("too_long");
						return;
					}
					const file = await ensureMp4Video(blob);
					await onComplete(file);
					return;
				}

				await new Promise((resolve) => {
					window.setTimeout(resolve, IMAGE_CAPTURE_DELAY_MS);
				});
				const file = await captureStillFrame(video, true);
				video.pause();
				await onComplete(file);
			} catch {
				setFailure("generic");
			} finally {
				setIsProcessing(false);
			}
		},
		[isVideoMode, onComplete],
	);

	useEffect(() => {
		let cancelled = false;

		async function setup() {
			if (!navigator.mediaDevices?.getUserMedia) {
				if (allowFileUpload) {
					setMode("upload");
					return;
				}
				setFailure("unsupported");
				return;
			}

			try {
				const landmarker = await createFaceLandmarker();
				if (cancelled) {
					landmarker.close();
					return;
				}
				landmarkerRef.current = landmarker;
			} catch {
				if (!cancelled) {
					setFailure("unsupported");
				}
				return;
			}

			if (isVideoMode && !pickRecordingMimeType()) {
				if (allowFileUpload) {
					setMode("upload");
					return;
				}
				setFailure("unsupported");
				return;
			}

			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: { facingMode: { ideal: "user" } },
					audio: false,
				});
				if (cancelled) {
					stopMediaStream(stream);
					return;
				}
				await lockCameraToDefaultZoom(stream);
				if (cancelled) {
					stopMediaStream(stream);
					return;
				}
				streamRef.current = stream;
				setMode("camera");
			} catch {
				if (cancelled) {
					return;
				}
				if (allowFileUpload) {
					setMode("upload");
					return;
				}
				setFailure("unsupported");
			}
		}

		void setup();

		return () => {
			cancelled = true;
			window.cancelAnimationFrame(rafRef.current);
			window.clearTimeout(recordTimeoutRef.current);
			window.clearInterval(recordIntervalRef.current);
			stopMediaStream(streamRef.current);
			streamRef.current = null;
			landmarkerRef.current?.close();
			landmarkerRef.current = null;
		};
	}, [allowFileUpload, isVideoMode]);

	useEffect(() => {
		const video = videoRef.current;
		const stream = streamRef.current;
		if (!video || !stream || mode !== "camera") {
			return;
		}
		video.srcObject = stream;
		void video.play();
		return () => {
			video.srcObject = null;
		};
	}, [mode]);

	useEffect(() => {
		if (mode !== "camera") {
			return;
		}

		void attempt;

		startedRef.current = false;
		completingRef.current = false;
		lastTimestampRef.current = -1;
		trackerRef.current.reset();
		isRecordingRef.current = false;
		setIsRecording(false);
		setCanRecord(false);
		setSecondsLeft(VIDEO_RECORDING_SECONDS);

		const loop = (nowMs: number) => {
			const video = videoRef.current;
			const landmarker = landmarkerRef.current;
			if (!video || !landmarker || video.readyState < 2) {
				rafRef.current = window.requestAnimationFrame(loop);
				return;
			}

			if (nowMs <= lastTimestampRef.current) {
				rafRef.current = window.requestAnimationFrame(loop);
				return;
			}
			lastTimestampRef.current = nowMs;

			const result = detectFace(landmarker, video, nowMs);
			const face = result?.faceLandmarks?.[0];
			const overlay = overlayRef.current;
			const layout =
				overlay && video.videoWidth > 0 && video.videoHeight > 0
					? {
							videoWidth: video.videoWidth,
							videoHeight: video.videoHeight,
							overlayWidth: overlay.clientWidth,
							overlayHeight: overlay.clientHeight,
							mirrored: true,
						}
					: undefined;
			const inOval = Boolean(result && face && isFaceInOval(face, layout));

			if (isVideoMode) {
				if (completingRef.current || isRecordingRef.current) {
					rafRef.current = window.requestAnimationFrame(loop);
					return;
				}
				if (!inOval) {
					setCanRecord(false);
					setPrompt((current) =>
						current === "Align your face in the oval."
							? current
							: "Align your face in the oval.",
					);
				} else {
					setCanRecord(true);
					setPrompt((current) =>
						current ===
						"Stay still, then start recording. Avoid extra movement."
							? current
							: "Stay still, then start recording. Avoid extra movement.",
					);
				}
				rafRef.current = window.requestAnimationFrame(loop);
				return;
			}

			if (!inOval) {
				if (startedRef.current) {
					void failCapture("left_oval");
					return;
				}
				setPrompt((current) =>
					current === "Align your face in the oval."
						? current
						: "Align your face in the oval.",
				);
				rafRef.current = window.requestAnimationFrame(loop);
				return;
			}

			if (!result) {
				rafRef.current = window.requestAnimationFrame(loop);
				return;
			}

			if (!startedRef.current) {
				trackerRef.current.start(["blink"], {
					requiredBlinks: 2,
				});
				startedRef.current = true;
			}

			const progress = trackerRef.current.process(result, nowMs);
			setPrompt((current) =>
				current === progress.prompt ? current : progress.prompt,
			);

			if (progress.status === "left_oval") {
				void failCapture("left_oval");
				return;
			}

			if (progress.status === "done" && !completingRef.current) {
				completingRef.current = true;
				window.cancelAnimationFrame(rafRef.current);
				void finishCapture(video);
				return;
			}

			rafRef.current = window.requestAnimationFrame(loop);
		};

		rafRef.current = window.requestAnimationFrame(loop);
		return () => {
			window.cancelAnimationFrame(rafRef.current);
		};
	}, [attempt, failCapture, finishCapture, isVideoMode, mode]);

	function handleStartRecording() {
		if (
			!isVideoMode ||
			isBusy ||
			isRecordingRef.current ||
			!canRecord ||
			!streamRef.current
		) {
			return;
		}

		const mimeType = pickRecordingMimeType();
		if (!mimeType) {
			setFailure("unsupported");
			return;
		}

		const recorder = new SizeCappedRecorder();
		recorder.start(streamRef.current, mimeType);
		recorderRef.current = recorder;
		isRecordingRef.current = true;
		setIsRecording(true);
		setCanRecord(false);
		setSecondsLeft(VIDEO_RECORDING_SECONDS);
		setPrompt("Keep still — avoid extra movement.");

		const startedAt = Date.now();
		recordIntervalRef.current = window.setInterval(() => {
			if (recorder.hasExceededCap()) {
				void failCapture("too_long");
				return;
			}
			const remainingMs = VIDEO_RECORDING_MS - (Date.now() - startedAt);
			setSecondsLeft(Math.max(0, Math.ceil(remainingMs / 1000)));
		}, 200);

		recordTimeoutRef.current = window.setTimeout(() => {
			window.clearInterval(recordIntervalRef.current);
			const video = videoRef.current;
			if (!video || completingRef.current) {
				return;
			}
			completingRef.current = true;
			window.cancelAnimationFrame(rafRef.current);
			void finishCapture(video);
		}, VIDEO_RECORDING_MS);
	}

	function handleUploadInstead() {
		if (!allowFileUpload || isBusy) {
			return;
		}
		window.cancelAnimationFrame(rafRef.current);
		window.clearTimeout(recordTimeoutRef.current);
		window.clearInterval(recordIntervalRef.current);
		isRecordingRef.current = false;
		stopMediaStream(streamRef.current);
		streamRef.current = null;
		setMode("upload");
	}

	function handleTryAgain() {
		window.clearTimeout(recordTimeoutRef.current);
		window.clearInterval(recordIntervalRef.current);
		isRecordingRef.current = false;
		setIsRecording(false);
		setCanRecord(false);
		setSecondsLeft(VIDEO_RECORDING_SECONDS);
		setFailure(null);
		startedRef.current = false;
		completingRef.current = false;
		setPrompt("Align your face in the oval.");
		setAttempt((value) => value + 1);
		void videoRef.current?.play();
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			{mode === "requesting" ? (
				<div className="flex flex-1 flex-col items-center justify-center gap-3 px-6">
					<Spinner className="size-6" />
					<p className="text-sm text-muted-foreground">Starting camera…</p>
				</div>
			) : null}

			{mode === "camera" ? (
				<div
					ref={overlayRef}
					className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-black"
				>
					<video
						ref={videoRef}
						className="absolute inset-0 size-full scale-x-[-1] object-cover"
						playsInline
						muted
						autoPlay
					/>
					<FaceOvalOverlay />
					<div className="relative z-10 mt-auto flex flex-col items-center gap-3 bg-linear-to-t from-black/70 to-transparent px-5 py-5">
						{isRecording ? (
							<p className="text-center text-4xl font-semibold text-white tabular-nums">
								{secondsLeft}
							</p>
						) : null}
						<p className="text-center text-sm font-medium text-white text-pretty tabular-nums">
							{isBusy ? "Saving your capture…" : prompt}
						</p>
						{isVideoMode && !isRecording && !isBusy ? (
							<Button
								type="button"
								className="active:scale-[0.96]"
								disabled={!canRecord}
								onClick={handleStartRecording}
							>
								<RecordIcon weight="fill" />
								Start recording
							</Button>
						) : null}
						{allowFileUpload && !isRecording ? (
							<Button
								type="button"
								variant="ghost"
								className="text-white hover:bg-white/10 hover:text-white"
								disabled={isBusy}
								onClick={handleUploadInstead}
							>
								Upload a file instead
							</Button>
						) : null}
					</div>
				</div>
			) : null}

			{mode === "upload" ? (
				<div className="flex flex-1 flex-col gap-4 px-6 py-6">
					<ProofFileUpload
						label="Face proof"
						emptyStateText="Upload a JPEG, PNG, or PDF up to 16MB"
						accept="image/jpeg,image/jpg,image/png,application/pdf"
						allowedMimeTypes={FACIAL_PROOF_MIME_TYPES}
						maxSize={FACIAL_PROOF_MAX_BYTES}
						disabled={isBusy}
						onFileChange={(file) => {
							if (file) {
								void onComplete(file);
							}
						}}
					/>
				</div>
			) : null}

			<Dialog open={failure !== null}>
				<DialogContent showCloseButton={false}>
					<DialogHeader>
						<DialogTitle className="font-semibold text-pretty">
							{failure === "unsupported"
								? "This phone does not support this feature"
								: "Let’s try that again"}
						</DialogTitle>
						<DialogDescription className="text-pretty">
							{failure === "unsupported"
								? "Kindly reach out to support or try again with another phone."
								: failure === "left_oval"
									? "Keep your face inside the oval for the whole check."
									: failure === "too_long"
										? "That recording was too large. Try again and keep still for the 5 second clip."
										: "We could not finish this capture. Try again."}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						{failure === "unsupported" ? null : (
							<Button
								type="button"
								className="w-full"
								onClick={handleTryAgain}
							>
								Try again
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

function FaceOvalOverlay() {
	const width = FACE_OVAL.rx * 2 * 100;
	const height = FACE_OVAL.ry * 2 * 100;
	const left = (FACE_OVAL.cx - FACE_OVAL.rx) * 100;
	const top = (FACE_OVAL.cy - FACE_OVAL.ry) * 100;

	return (
		<div
			className="pointer-events-none absolute inset-0 z-1 overflow-hidden"
			aria-hidden="true"
		>
			<div
				className="absolute"
				style={{
					left: `${left}%`,
					top: `${top}%`,
					width: `${width}%`,
					height: `${height}%`,
					borderRadius: "50%",
					boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.45)",
					outline: "2px solid rgba(255, 255, 255, 0.88)",
				}}
			/>
		</div>
	);
}
