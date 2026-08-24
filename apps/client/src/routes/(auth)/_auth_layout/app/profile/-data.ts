import { z } from "zod";

import { getUserInitials } from "../team/-data";

export const profileSearchSchema = z.object({
	tab: z.enum(["profile", "password"]).optional(),
});

export type ProfileSearchParams = z.infer<typeof profileSearchSchema>;

export function mergeProfileSearchParams(
	current: ProfileSearchParams,
	patch: Partial<ProfileSearchParams>,
): ProfileSearchParams {
	const nextTab = patch.tab ?? current.tab ?? "profile";

	if (nextTab === "profile") {
		return {};
	}

	return { tab: nextTab };
}

export function getProfileDisplayName(firstName?: string, lastName?: string) {
	return [firstName, lastName].filter(Boolean).join(" ").trim();
}

export function getProfileInitials(firstName?: string, lastName?: string) {
	const displayName = getProfileDisplayName(firstName, lastName);

	if (!displayName) {
		return "U";
	}

	return getUserInitials(displayName);
}
