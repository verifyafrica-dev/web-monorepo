import { FlaskIcon, LightningIcon } from "@phosphor-icons/react";
import { Loader2Icon } from "lucide-react";
import { useApiModeStore } from "#/stores/api-mode-store";

export function EnvironmentSwitchOverlay() {
	const isSwitching = useApiModeStore((state) => state.isEnvironmentSwitching);
	const target = useApiModeStore((state) => state.environmentSwitchTarget);

	if (!isSwitching || !target) return null;

	const nextLabel = target === "test" ? "Test" : "Live";
	const Icon = target === "test" ? FlaskIcon : LightningIcon;

	return (
		<div
			className="fixed inset-0 z-[200] flex items-center justify-center bg-background/70 backdrop-blur-[2px]"
			role="alertdialog"
			aria-modal="true"
			aria-busy="true"
			aria-live="polite"
			aria-label={`Switching to ${nextLabel} mode`}
		>
			<div className="pointer-events-none flex flex-col items-center gap-3 rounded-xl border bg-card px-6 py-5 shadow-lg">
				<div className="flex items-center gap-2 text-foreground">
					<Icon className="size-5" weight="duotone" />
					<Loader2Icon className="size-5 animate-spin text-primary" />
				</div>
				<p className="text-sm font-medium">
					Switching to {nextLabel} mode…
				</p>
				<p className="text-xs text-muted-foreground">
					Refreshing workspace data. Please wait.
				</p>
			</div>
		</div>
	);
}
