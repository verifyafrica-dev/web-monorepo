import {
	CaretLeftIcon,
	FileTextIcon,
	IdentificationCardIcon,
	ImageIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import type { Country } from "react-phone-number-input";

import { Button } from "@verifyafrica/ui/components/ui/button";
import { Spinner } from "@verifyafrica/ui/components/ui/spinner";
import { PhoneCountryFlag } from "@verifyafrica/ui/components/ui-extended/country-flag";
import { ProofFileUpload } from "#/components/ui-extended/proof-file-upload";
import { getCountryCode, getCountryName } from "@verifyafrica/ui/lib/country-state-city";
import { cn } from "@verifyafrica/ui/lib/utils";

import {
	InstructionAvoidBlurArt,
	InstructionAvoidDistantArt,
	InstructionAvoidExpiredArt,
	InstructionAvoidGlareArt,
	InstructionHeroArt,
} from "./id-document-instruction-art";

const CAMERA_PERMISSION_TIMEOUT_MS = 30_000;
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const ACCEPTED_UPLOAD_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"application/pdf",
] as const;

const AVOID_INSTRUCTIONS = [
	{
		label: "Avoid Glare on Document",
		Art: InstructionAvoidGlareArt,
	},
	{
		label: "Avoid Expired Document",
		Art: InstructionAvoidExpiredArt,
	},
	{
		label: "Avoid Blurred Document",
		Art: InstructionAvoidBlurArt,
	},
	{
		label: "Avoid Distant Capture",
		Art: InstructionAvoidDistantArt,
	},
] as const;

export type IdDocumentCaptureResult = {
	front: File;
	back: File | null;
};

type IdDocumentCaptureProps = {
	/** Heading shown in the capture header. */
	title: string;
	/** ISO country code used only to render the header flag. */
	country: string;
	/** When true, a back-of-document file is required in the result. */
	requireBackside: boolean;
	onBack: () => void;
	/** Called when the user finishes capture or upload with the required files. */
	onComplete: (result: IdDocumentCaptureResult) => void | Promise<void>;
	/** Disables back, file changes, and Next while proof is uploading. */
	isSubmitting?: boolean;
};

/**
 * Intermediary for capturing a document via camera or file upload.
 * Returns only the selected proof files; personal details stay with the parent.
 */
export function IdDocumentCapture({
	country,
	title,
	requireBackside,
	onBack,
	onComplete,
	isSubmitting = false,
}: IdDocumentCaptureProps) {
	const [mode, setMode] = useState<"requesting" | "camera" | "upload">(
		"requesting",
	);
	const [isInstructionsOpen, setIsInstructionsOpen] = useState(true);
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [frontFile, setFrontFile] = useState<File | null>(null);
	const [backFile, setBackFile] = useState<File | null>(null);
	const videoRef = useRef<HTMLVideoElement>(null);

	const countryName = getCountryName(country);
	const countryCode = getCountryCode(country) as Country;

	useEffect(() => {
		let cancelled = false;
		let mediaStream: MediaStream | null = null;

		const timeoutId = window.setTimeout(() => {
			if (!cancelled) {
				setMode("upload");
				setIsInstructionsOpen(false);
			}
		}, CAMERA_PERMISSION_TIMEOUT_MS);

		async function requestCamera() {
			if (!navigator.mediaDevices?.getUserMedia) {
				window.clearTimeout(timeoutId);
				setMode("upload");
				setIsInstructionsOpen(false);
				return;
			}

			try {
				mediaStream = await navigator.mediaDevices.getUserMedia({
					video: { facingMode: { ideal: "environment" } },
					audio: false,
				});

				if (cancelled) {
					stopMediaStream(mediaStream);
					return;
				}

				window.clearTimeout(timeoutId);
				setStream(mediaStream);
				setMode("camera");
			} catch {
				if (!cancelled) {
					window.clearTimeout(timeoutId);
					setMode("upload");
					setIsInstructionsOpen(false);
				}
			}
		}

		void requestCamera();

		return () => {
			cancelled = true;
			window.clearTimeout(timeoutId);
			if (mediaStream) {
				stopMediaStream(mediaStream);
			}
		};
	}, []);

	useEffect(() => {
		const video = videoRef.current;

		if (!video || !stream) {
			return;
		}

		video.srcObject = stream;
		void video.play();

		return () => {
			video.srcObject = null;
		};
	}, [stream]);

	useEffect(() => {
		if (mode !== "upload" || !stream) {
			return;
		}

		stopMediaStream(stream);
		setStream(null);
	}, [mode, stream]);

	function handleUploadInstead() {
		setMode("upload");
		setIsInstructionsOpen(false);
	}

	async function handleCapturePhoto() {
		const video = videoRef.current;

		if (!video || video.videoWidth === 0) {
			return;
		}

		const canvas = document.createElement("canvas");
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		const context = canvas.getContext("2d");

		if (!context) {
			return;
		}

		context.drawImage(video, 0, 0);
		const blob = await new Promise<Blob | null>((resolve) => {
			canvas.toBlob(resolve, "image/jpeg", 0.92);
		});

		if (!blob) {
			return;
		}

		const file = new File(
			[blob],
			frontFile && requireBackside ? "document-back.jpg" : "document-front.jpg",
			{ type: "image/jpeg" },
		);

		if (!frontFile) {
			setFrontFile(file);

			if (!requireBackside) {
				setMode("upload");
				setIsInstructionsOpen(false);
			}

			return;
		}

		if (requireBackside && !backFile) {
			setBackFile(file);
			setMode("upload");
			setIsInstructionsOpen(false);
			return;
		}

		setMode("upload");
		setIsInstructionsOpen(false);
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="flex items-center justify-between gap-3 px-4 pt-1 pb-3 md:px-5">
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					className="-ml-1"
					onClick={onBack}
					disabled={isSubmitting}
					aria-label="Go back"
				>
					<CaretLeftIcon
						className="size-5"
						weight="bold"
					/>
				</Button>
				<div className="flex min-w-0 items-center gap-2">
					{countryCode ? (
						<PhoneCountryFlag
							country={countryCode}
							countryName={countryName}
							className="h-5 w-7 rounded-none"
						/>
					) : null}
					<h2 className="truncate text-lg font-semibold tracking-tight text-pretty">
						{title}
					</h2>
				</div>
				<span className="size-8" />
			</div>

			{mode === "upload" ? (
				<IdDocumentUploadForm
					requireBackside={requireBackside}
					frontFile={frontFile}
					backFile={backFile}
					onFrontFileChange={setFrontFile}
					onBackFileChange={setBackFile}
					isSubmitting={isSubmitting}
					onComplete={() => {
						if (!frontFile) {
							return;
						}

						void onComplete({
							front: frontFile,
							back: requireBackside ? backFile : null,
						});
					}}
				/>
			) : (
				<div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-black">
					{mode === "camera" ? (
						<video
							ref={videoRef}
							className="absolute inset-0 size-full object-cover"
							autoPlay
							muted
							playsInline
						/>
					) : null}

					{isInstructionsOpen ? (
						<IdDocumentInstructions
							onClose={() => setIsInstructionsOpen(false)}
							onUploadInstead={handleUploadInstead}
							isRequesting={mode === "requesting"}
						/>
					) : (
						<div className="relative z-10 mt-auto flex flex-col items-center gap-3 bg-linear-to-t from-black/70 to-transparent px-5 py-5">
							{mode === "requesting" ? (
								<p className="text-center text-sm text-white/90">
									Waiting for camera permission…
								</p>
							) : (
								<Button
									type="button"
									className="rounded-full px-6"
									onClick={() => void handleCapturePhoto()}
								>
									Take photo
								</Button>
							)}
							<Button
								type="button"
								variant="ghost"
								className="text-white hover:bg-white/10 hover:text-white"
								onClick={handleUploadInstead}
							>
								Upload instead
							</Button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

function stopMediaStream(mediaStream: MediaStream) {
	for (const track of mediaStream.getTracks()) {
		track.stop();
	}
}

function IdDocumentInstructions({
	onClose,
	onUploadInstead,
	isRequesting,
}: {
	onClose: () => void;
	onUploadInstead: () => void;
	isRequesting: boolean;
}) {
	return (
		<div className="absolute inset-x-0 bottom-0 top-10 z-10 flex flex-col rounded-t-3xl bg-white px-5 pb-5 pt-4 shadow-[0_-12px_40px_rgba(10,37,64,0.12)]">
			<div className="mb-1 flex items-start justify-between">
				<h3 className="flex-1 text-center text-xl font-semibold tracking-tight text-pretty">
					Instructions
				</h3>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					className="-mr-1"
					onClick={onClose}
					aria-label="Close instructions"
				>
					<XIcon className="size-4" />
				</Button>
			</div>

			<div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto">
				<InstructionHeroArt className="h-28 w-auto" />
				<p className="mt-1 text-center text-sm text-muted-foreground text-pretty">
					Adjust all four corners within the frame
				</p>

				<div className="mt-6 grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
					{AVOID_INSTRUCTIONS.map(({ label, Art }) => (
						<div
							key={label}
							className="flex flex-col items-center gap-2 text-center"
						>
							<Art className="h-16 w-full" />
							<p className="text-[11px] leading-4 text-muted-foreground text-pretty">
								{label}
							</p>
						</div>
					))}
				</div>
			</div>

			<div className="mt-5 flex flex-col items-center gap-2">
				{isRequesting ? (
					<p className="text-center text-xs text-muted-foreground">
						Allow camera access to continue, or upload a file instead.
					</p>
				) : null}
				<Button
					type="button"
					variant="outline"
					className="rounded-full"
					onClick={onUploadInstead}
				>
					Upload instead
				</Button>
			</div>
		</div>
	);
}

function IdDocumentUploadForm({
	requireBackside,
	frontFile,
	backFile,
	onFrontFileChange,
	onBackFileChange,
	onComplete,
	isSubmitting,
}: {
	requireBackside: boolean;
	frontFile: File | null;
	backFile: File | null;
	onFrontFileChange: (file: File | null) => void;
	onBackFileChange: (file: File | null) => void;
	onComplete: () => void;
	isSubmitting: boolean;
}) {
	return (
		<div className="flex min-h-0 flex-1 flex-col px-5 pb-5">
			<div
				className={cn(
					"grid gap-8",
					requireBackside ? "sm:grid-cols-2" : "grid-cols-1",
				)}
			>
				<ProofFileUpload
					label="Upload frontside"
					emptyStateText="Drop your file or click to upload"
					file={frontFile}
					onFileChange={onFrontFileChange}
					disabled={isSubmitting}
					accept={ACCEPTED_UPLOAD_MIME_TYPES.join(",")}
					allowedMimeTypes={ACCEPTED_UPLOAD_MIME_TYPES}
					maxSize={MAX_UPLOAD_BYTES}
					icon={IdentificationCardIcon}
					iconWeight="duotone"
					iconClassName="size-10"
					dropzoneClassName="min-h-44 gap-3 rounded-2xl px-4"
				/>
				{requireBackside ? (
					<ProofFileUpload
						label="Upload backside"
						emptyStateText="Drop your file or click to upload"
						file={backFile}
						onFileChange={onBackFileChange}
						disabled={isSubmitting}
						accept={ACCEPTED_UPLOAD_MIME_TYPES.join(",")}
						allowedMimeTypes={ACCEPTED_UPLOAD_MIME_TYPES}
						maxSize={MAX_UPLOAD_BYTES}
						icon={IdentificationCardIcon}
						iconWeight="duotone"
						iconClassName="size-10"
						dropzoneClassName="min-h-44 gap-3 rounded-2xl px-4"
					/>
				) : null}
			</div>

			<div className="mt-5 flex flex-wrap justify-center gap-2">
				<UploadHint
					icon={FileTextIcon}
					label="pdf (no password)"
				/>
				<UploadHint
					icon={ImageIcon}
					label="photo (png, jpeg)"
				/>
				<UploadHint label="Max size of: 20MB" />
			</div>

			<div className="mt-4 flex justify-end">
				<Button
					type="button"
					className="rounded-full px-6"
					disabled={
						isSubmitting || !frontFile || (requireBackside && !backFile)
					}
					onClick={onComplete}
				>
					{isSubmitting ? (
						<>
							<Spinner className="size-4" />
							Submitting…
						</>
					) : (
						"Next"
					)}
				</Button>
			</div>
		</div>
	);
}

function UploadHint({
	icon: Icon,
	label,
}: {
	icon?: typeof FileTextIcon;
	label: string;
}) {
	return (
		<span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground">
			{Icon ? <Icon className="size-3.5" /> : null}
			{label}
		</span>
	);
}
