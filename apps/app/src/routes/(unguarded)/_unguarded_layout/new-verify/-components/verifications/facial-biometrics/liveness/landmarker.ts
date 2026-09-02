import {
	FaceLandmarker,
	FilesetResolver,
	type FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";

const WASM_ROOT =
	"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";
const MODEL_URL =
	"https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export async function createFaceLandmarker(): Promise<FaceLandmarker> {
	const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
	const options = {
		baseOptions: {
			modelAssetPath: MODEL_URL,
			delegate: "GPU" as const,
		},
		runningMode: "VIDEO" as const,
		numFaces: 1,
		outputFaceBlendshapes: true,
		outputFacialTransformationMatrixes: false,
	};

	try {
		return await FaceLandmarker.createFromOptions(vision, options);
	} catch {
		return await FaceLandmarker.createFromOptions(vision, {
			...options,
			baseOptions: { ...options.baseOptions, delegate: "CPU" },
		});
	}
}

export function detectFace(
	landmarker: FaceLandmarker,
	video: HTMLVideoElement,
	nowMs: number,
): FaceLandmarkerResult | null {
	try {
		return landmarker.detectForVideo(video, nowMs);
	} catch {
		return null;
	}
}
