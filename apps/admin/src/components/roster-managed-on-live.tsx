import { InfoIcon } from "@phosphor-icons/react";

import { Alert, AlertDescription } from "@verifyafrica/ui/components/ui/alert";
import { useApiModeStore } from "#/stores/api-mode-store";

export const ROSTER_MANAGED_ON_LIVE_MESSAGE =
	"Team members and organizations are managed in Live mode, then copied to Test. Switch to Live to invite someone or change the team.";

export function useRosterChangesAllowed() {
	const apiMode = useApiModeStore((state) => state.mode);
	return apiMode !== "test";
}

export function RosterManagedOnLiveNotice() {
	const rosterChangesAllowed = useRosterChangesAllowed();

	if (rosterChangesAllowed) {
		return null;
	}

	return (
		<Alert className="border-blue-200 bg-blue-50 text-blue-900">
			<InfoIcon />
			<AlertDescription>{ROSTER_MANAGED_ON_LIVE_MESSAGE}</AlertDescription>
		</Alert>
	);
}
