import type { FaceLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";

import { LIVENESS_ACTION_PROMPTS, type LivenessAction } from "./actions";

const NOSE_TIP = 1;
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;
const FOREHEAD = 10;
const CHIN = 152;

type BlendshapeCategory = {
	categoryName?: string;
	displayName?: string;
	score: number;
};

export type ChallengeStatus = "idle" | "running" | "done" | "left_oval";

export type ChallengeProgress = {
	status: ChallengeStatus;
	action: LivenessAction | null;
	actionIndex: number;
	actionCount: number;
	prompt: string;
};

function blendscore(
	categories: BlendshapeCategory[] | undefined,
	name: string,
): number {
	if (!categories) {
		return 0;
	}
	const hit = categories.find(
		(item) => item.categoryName === name || item.displayName === name,
	);
	return hit?.score ?? 0;
}

function nodSignal(landmarks: NormalizedLandmark[]): number | null {
	const nose = landmarks[NOSE_TIP];
	const left = landmarks[LEFT_EYE_OUTER];
	const right = landmarks[RIGHT_EYE_OUTER];
	const forehead = landmarks[FOREHEAD];
	const chin = landmarks[CHIN];
	if (!nose || !left || !right || !forehead || !chin) {
		return null;
	}
	const eyeMidY = (left.y + right.y) / 2;
	const faceHeight = Math.abs(chin.y - forehead.y);
	const iod = Math.hypot(right.x - left.x, right.y - left.y);
	const scale = Math.max(faceHeight, iod, 1e-3);
	return (nose.y - eyeMidY) / scale;
}

function yawSignal(landmarks: NormalizedLandmark[]): number | null {
	const nose = landmarks[NOSE_TIP];
	const left = landmarks[LEFT_EYE_OUTER];
	const right = landmarks[RIGHT_EYE_OUTER];
	if (!nose || !left || !right) {
		return null;
	}
	const iod = Math.abs(right.x - left.x);
	if (iod < 1e-3) {
		return null;
	}
	return (nose.x - (left.x + right.x) / 2) / iod;
}

class GestureTracker {
	private samples = 0;
	private baseline: number | null = null;
	private peak = 0;
	private wentOut = false;
	private complete = false;
	private readonly calibrateFrames = 10;
	private readonly outThreshold: number;
	private readonly returnThreshold: number;
	private readonly direction: 1 | -1 | 0;

	constructor(options: {
		outThreshold: number;
		returnThreshold: number;
		direction?: 1 | -1;
	}) {
		this.outThreshold = options.outThreshold;
		this.returnThreshold = options.returnThreshold;
		this.direction = options.direction ?? 0;
	}

	reset() {
		this.samples = 0;
		this.baseline = null;
		this.peak = 0;
		this.wentOut = false;
		this.complete = false;
	}

	get isComplete() {
		return this.complete;
	}

	push(signal: number | null) {
		if (signal == null || Number.isNaN(signal)) {
			return;
		}
		if (this.baseline === null || this.samples < this.calibrateFrames) {
			this.baseline =
				this.baseline == null ? signal : this.baseline * 0.75 + signal * 0.25;
			this.samples += 1;
			this.peak = 0;
			return;
		}

		const delta = signal - this.baseline;
		const signed = this.direction === 0 ? delta : delta * this.direction;
		const amount = Math.abs(signed);

		if (!this.wentOut) {
			if (amount > this.peak) {
				this.peak = amount;
			}
			if (this.peak >= this.outThreshold && (this.direction === 0 || signed > 0)) {
				this.wentOut = true;
			}
			return;
		}

		if (signed <= this.returnThreshold) {
			this.complete = true;
		}
	}
}

class BlinkTracker {
	private blinks = 0;
	private eyesClosed = false;
	private closedFrames = 0;
	private openFrames = 0;
	private cooldownUntil = 0;
	private readonly required: number;

	constructor(required: number) {
		this.required = required;
	}

	reset() {
		this.blinks = 0;
		this.eyesClosed = false;
		this.closedFrames = 0;
		this.openFrames = 0;
		this.cooldownUntil = 0;
	}

	get isComplete() {
		return this.blinks >= this.required;
	}

	get completedCount() {
		return this.blinks;
	}

	get requiredCount() {
		return this.required;
	}

	push(shapes: BlendshapeCategory[] | undefined, nowMs: number) {
		const score = Math.max(
			blendscore(shapes, "eyeBlinkLeft"),
			blendscore(shapes, "eyeBlinkRight"),
		);
		if (nowMs < this.cooldownUntil) {
			return;
		}
		if (!this.eyesClosed) {
			if (score >= 0.45) {
				this.closedFrames += 1;
				this.openFrames = 0;
				if (this.closedFrames >= 2) {
					this.eyesClosed = true;
				}
			} else {
				this.closedFrames = 0;
			}
			return;
		}
		if (score <= 0.25) {
			this.openFrames += 1;
			if (this.openFrames >= 2) {
				this.blinks += 1;
				this.eyesClosed = false;
				this.closedFrames = 0;
				this.openFrames = 0;
				this.cooldownUntil = nowMs + 350;
			}
		} else if (score >= 0.45) {
			this.openFrames = 0;
		}
	}
}

class MouthTracker {
	private opened = false;
	private complete = false;

	reset() {
		this.opened = false;
		this.complete = false;
	}

	get isComplete() {
		return this.complete;
	}

	push(shapes: BlendshapeCategory[] | undefined) {
		const jaw = blendscore(shapes, "jawOpen");
		if (!this.opened) {
			if (jaw >= 0.35) {
				this.opened = true;
			}
			return;
		}
		if (jaw <= 0.12) {
			this.complete = true;
		}
	}
}

export class LivenessChallengeTracker {
	private actions: LivenessAction[] = [];
	private index = 0;
	private status: ChallengeStatus = "idle";
	private blink = new BlinkTracker(1);
	private nod = new GestureTracker({ outThreshold: 0.08, returnThreshold: 0.035 });
	private yaw = new GestureTracker({
		outThreshold: 0.12,
		returnThreshold: 0.05,
		direction: 1,
	});
	private mouth = new MouthTracker();

	start(actions: LivenessAction[], options?: { requiredBlinks?: number }) {
		this.actions = actions;
		this.index = 0;
		this.status = "running";
		this.blink = new BlinkTracker(options?.requiredBlinks ?? 1);
		this.resetCurrentGesture();
	}

	reset() {
		this.actions = [];
		this.index = 0;
		this.status = "idle";
		this.resetCurrentGesture();
	}

	private resetCurrentGesture() {
		this.blink.reset();
		this.nod.reset();
		this.yaw = new GestureTracker({
			outThreshold: 0.12,
			returnThreshold: 0.05,
			direction: this.currentAction() === "turn_left" ? -1 : 1,
		});
		this.mouth.reset();
	}

	private currentAction(): LivenessAction | null {
		return this.actions[this.index] ?? null;
	}

	process(result: FaceLandmarkerResult, nowMs: number): ChallengeProgress {
		if (this.status !== "running") {
			return this.progress();
		}

		const face = result.faceLandmarks?.[0];
		if (!face) {
			this.status = "left_oval";
			return this.progress("Keep your face in view.");
		}

		const action = this.currentAction();
		const shapes = result.faceBlendshapes?.[0]?.categories;

		if (action === "blink") {
			this.blink.push(shapes, nowMs);
			if (this.blink.isComplete) {
				this.advance();
			}
		} else if (action === "nod") {
			this.nod.push(nodSignal(face));
			if (this.nod.isComplete) {
				this.advance();
			}
		} else if (action === "turn_left" || action === "turn_right") {
			this.yaw.push(yawSignal(face));
			if (this.yaw.isComplete) {
				this.advance();
			}
		} else if (action === "open_mouth") {
			this.mouth.push(shapes);
			if (this.mouth.isComplete) {
				this.advance();
			}
		}

		return this.progress();
	}

	private advance() {
		this.index += 1;
		if (this.index >= this.actions.length) {
			this.status = "done";
			return;
		}
		this.resetCurrentGesture();
	}

	private progress(overridePrompt?: string): ChallengeProgress {
		const action = this.currentAction();
		let prompt = overridePrompt ?? "";
		if (!prompt) {
			if (this.status === "idle") {
				prompt = "Get ready.";
			} else if (this.status === "done") {
				prompt = "Liveness complete.";
			} else if (this.status === "left_oval") {
				prompt = "Keep your face inside the oval.";
			} else if (action === "blink" && this.blink.requiredCount > 1) {
				const remaining = this.blink.requiredCount - this.blink.completedCount;
				prompt =
					remaining === this.blink.requiredCount
						? "Blink twice — close your eyes, then open them, then blink again."
						: "Blink once more.";
			} else if (action) {
				prompt = LIVENESS_ACTION_PROMPTS[action];
			}
		}

		return {
			status: this.status,
			action,
			actionIndex: Math.min(this.index, this.actions.length),
			actionCount: this.actions.length,
			prompt,
		};
	}
}
