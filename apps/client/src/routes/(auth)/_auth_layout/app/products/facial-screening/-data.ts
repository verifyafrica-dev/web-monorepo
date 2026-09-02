export type FaceVerificationMode = "image" | "video";

export const FACE_VERIFICATION_MODES = [
	{ value: "image" as const, label: "Image Only" },
	{ value: "video" as const, label: "Video Only" },
] satisfies Array<{ value: FaceVerificationMode; label: string }>;

export const FACE_AGE_MIN_YEARS = 16;

export const DEFAULT_FACE_VERIFICATION_MODE: FaceVerificationMode = "image";

export const FACIAL_PROOF_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"application/pdf",
] as const;

export const FACIAL_PROOF_MAX_BYTES = 16 * 1024 * 1024;
