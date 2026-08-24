export type FaceVerificationMode = "any" | "image" | "video";

export const FACE_VERIFICATION_MODES = [
	{ value: "any" as const, label: "Any" },
	{ value: "image" as const, label: "Image Only" },
	{ value: "video" as const, label: "Video Only" },
] satisfies Array<{ value: FaceVerificationMode; label: string }>;

export const DEFAULT_FACE_VERIFICATION_MODE: FaceVerificationMode = "any";
