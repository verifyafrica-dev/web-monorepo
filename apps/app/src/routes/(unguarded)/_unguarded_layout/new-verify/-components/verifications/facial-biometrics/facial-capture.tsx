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

import { pickRandomLivenessActions } from "./liveness/actions";
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
const VIDEO_ACTION_COUNT = 2;

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

	const isVideoMode = verificationMode === "video_only";
	const isBusy = isProcessing || isSubmitting;

	const failCapture = useCallback(async (reason: FailureReason) => {
		window.cancelAnimationFrame(rafRef.current);
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

			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: { facingMode: { ideal: "user" } },
					audio: false,
				});
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
			stopMediaStream(streamRef.current);
			streamRef.current = null;
			landmarkerRef.current?.close();
			landmarkerRef.current = null;
		};
	}, [allowFileUpload]);

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

		const actions = isVideoMode
			? pickRandomLivenessActions(VIDEO_ACTION_COUNT)
			: (["blink"] as const);
		startedRef.current = false;
		completingRef.current = false;
		lastTimestampRef.current = -1;
		trackerRef.current.reset();

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
			if (!result || !face || !isFaceInOval(face, layout)) {
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

			if (!startedRef.current) {
				trackerRef.current.start([...actions]);
				if (isVideoMode && streamRef.current) {
					const mimeType = pickRecordingMimeType();
					if (!mimeType) {
						setFailure("unsupported");
						return;
					}
					const recorder = new SizeCappedRecorder();
					recorder.start(streamRef.current, mimeType);
					recorderRef.current = recorder;
				}
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

			if (recorderRef.current?.hasExceededCap()) {
				void failCapture("too_long");
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

	function handleUploadInstead() {
		if (!allowFileUpload || isBusy) {
			return;
		}
		window.cancelAnimationFrame(rafRef.current);
		stopMediaStream(streamRef.current);
		streamRef.current = null;
		setMode("upload");
	}

	function handleTryAgain() {
		setFailure(null);
		startedRef.current = false;
		completingRef.current = false;
		setPrompt("Align your face in the oval.");
		setAttempt((value) => value + 1);
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
						<p className="text-center text-sm font-medium text-white text-pretty tabular-nums">
							{isProcessing ? "Saving your capture…" : prompt}
						</p>
						{allowFileUpload ? (
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
										? "That recording was too long. Try again and complete the actions a little faster."
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
