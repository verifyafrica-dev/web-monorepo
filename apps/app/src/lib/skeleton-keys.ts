export function createSkeletonKeys(
	count: number,
	prefix = "skeleton",
): string[] {
	return Array.from({ length: count }, (_, index) => `${prefix}-${index}`);
}
