export const LIVENESS_ACTIONS = [
	"blink",
	"turn_left",
	"turn_right",
	"nod",
	"open_mouth",
] as const;

export type LivenessAction = (typeof LIVENESS_ACTIONS)[number];

export const LIVENESS_ACTION_PROMPTS: Record<LivenessAction, string> = {
	blink: "Blink fully — close your eyes, then open them.",
	turn_left: "Turn your head clearly to the left, then back to center.",
	turn_right: "Turn your head clearly to the right, then back to center.",
	nod: "Nod — tilt your chin down, then back up.",
	open_mouth: "Open your mouth, then close it.",
};

export function pickRandomLivenessActions(count: number): LivenessAction[] {
	const pool = [...LIVENESS_ACTIONS];
	for (let index = pool.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1));
		const current = pool[index];
		const swap = pool[swapIndex];
		if (current === undefined || swap === undefined) {
			continue;
		}
		pool[index] = swap;
		pool[swapIndex] = current;
	}
	return pool.slice(0, Math.min(count, pool.length));
}
