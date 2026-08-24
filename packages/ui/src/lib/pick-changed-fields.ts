function areValuesEqual(left: unknown, right: unknown) {
	if (Object.is(left, right)) {
		return true;
	}

	if (Array.isArray(left) || Array.isArray(right)) {
		if (!Array.isArray(left) || !Array.isArray(right)) {
			return false;
		}

		return JSON.stringify(left) === JSON.stringify(right);
	}

	if (
		typeof left === "object" &&
		left !== null &&
		typeof right === "object" &&
		right !== null
	) {
		return JSON.stringify(left) === JSON.stringify(right);
	}

	return false;
}

export function pickChangedFields<T extends Record<string, unknown>>(
	original: T,
	next: T,
): Partial<T> {
	const changed: Partial<T> = {};

	for (const key of Object.keys(next) as Array<keyof T>) {
		if (!areValuesEqual(original[key], next[key])) {
			changed[key] = next[key];
		}
	}

	return changed;
}

export function hasChangedFields<T extends Record<string, unknown>>(
	original: T,
	next: T,
) {
	return Object.keys(pickChangedFields(original, next)).length > 0;
}
