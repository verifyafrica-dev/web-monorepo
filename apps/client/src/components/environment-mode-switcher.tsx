import { FlaskIcon, LightningIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useSwitchApiMode } from "#/lib/api-mode";
import { cn } from "@verifyafrica/ui/lib/utils";

export function EnvironmentModeSwitcher({
	className,
}: {
	className?: string;
}) {
	const { mode, switchApiMode, switcherEnabled } = useSwitchApiMode();
	const [isSwitching, setIsSwitching] = useState(false);

	if (!switcherEnabled) return null;

	async function handleSwitch(next: "live" | "test") {
		if (isSwitching || next === mode) return;
		setIsSwitching(true);
		try {
			await switchApiMode(next);
		} finally {
			setIsSwitching(false);
		}
	}

	return (
		<div
			className={cn(
				"inline-flex items-center rounded-lg border bg-background p-0.5 text-xs font-medium",
				className,
			)}
			role="group"
			aria-label="API environment"
		>
			<button
				type="button"
				disabled={isSwitching}
				onClick={() => void handleSwitch("live")}
				className={cn(
					"inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors",
					mode === "live"
						? "bg-foreground text-background"
						: "text-muted-foreground hover:text-foreground",
					isSwitching && "opacity-60",
				)}
			>
				<LightningIcon className="size-3.5" weight="bold" />
				Live
			</button>
			<button
				type="button"
				disabled={isSwitching}
				onClick={() => void handleSwitch("test")}
				className={cn(
					"inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors",
					mode === "test"
						? "bg-amber-600 text-white"
						: "text-muted-foreground hover:text-foreground",
					isSwitching && "opacity-60",
				)}
			>
				<FlaskIcon className="size-3.5" weight="bold" />
				Test
			</button>
		</div>
	);
}

export function TestModeBanner() {
	const { mode, switcherEnabled } = useSwitchApiMode();

	if (!switcherEnabled || mode !== "test") return null;

	return (
		<div className="border-b border-amber-600/30 bg-amber-500/15 px-4 py-2 text-center text-sm text-amber-950 dark:text-amber-100">
			You are in <span className="font-semibold">Test mode</span>. Data and
			API keys are from the test environment — not production.
		</div>
	);
}
