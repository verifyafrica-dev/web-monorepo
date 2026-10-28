import { FlaskIcon, LightningIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useSwitchApiMode } from "#/lib/api-mode";
import {
	TEST_ACCOUNT_BLOCKED_DESCRIPTION,
	TEST_ACCOUNT_BLOCKED_SUPPORT_EMAIL,
	TEST_ACCOUNT_BLOCKED_TITLE,
} from "#/lib/test-account-blocked";
import { cn } from "@verifyafrica/ui/lib/utils";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@verifyafrica/ui/components/ui/alert-dialog";

export function EnvironmentModeSwitcher({
	className,
}: {
	className?: string;
}) {
	const { mode, switchApiMode, switcherEnabled } = useSwitchApiMode();
	const [isSwitching, setIsSwitching] = useState(false);
	const [blockedOpen, setBlockedOpen] = useState(false);

	if (!switcherEnabled) return null;

	async function handleSwitch(next: "live" | "test") {
		if (isSwitching || next === mode) return;
		setIsSwitching(true);
		try {
			const result = await switchApiMode(next);
			if (!result.ok && result.reason === "blocked") {
				setBlockedOpen(true);
			}
		} finally {
			setIsSwitching(false);
		}
	}

	return (
		<>
			<div
				className={cn(
					"flex w-full flex-col gap-1.5 group-data-[collapsible=icon]:items-center",
					className,
				)}
			>
				<p className="px-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase group-data-[collapsible=icon]:hidden">
					Environment
				</p>
				<div
					className={cn(
						"inline-flex w-full items-center rounded-lg border bg-background p-0.5 text-xs font-medium",
						"group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:flex-col",
					)}
					role="group"
					aria-label="API environment"
				>
					<button
						type="button"
						disabled={isSwitching}
						title="Live mode"
						onClick={() => void handleSwitch("live")}
						className={cn(
							"inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors",
							"group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:px-2",
							mode === "live"
								? "bg-foreground text-background"
								: "text-muted-foreground hover:text-foreground",
							isSwitching && "opacity-60",
						)}
					>
						<LightningIcon className="size-3.5 shrink-0" weight="bold" />
						<span className="group-data-[collapsible=icon]:hidden">Live</span>
					</button>
					<button
						type="button"
						disabled={isSwitching}
						title="Test mode"
						onClick={() => void handleSwitch("test")}
						className={cn(
							"inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors",
							"group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:px-2",
							mode === "test"
								? "bg-amber-600 text-white"
								: "text-muted-foreground hover:text-foreground",
							isSwitching && "opacity-60",
						)}
					>
						<FlaskIcon className="size-3.5 shrink-0" weight="bold" />
						<span className="group-data-[collapsible=icon]:hidden">Test</span>
					</button>
				</div>
			</div>

			<AlertDialog open={blockedOpen} onOpenChange={setBlockedOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{TEST_ACCOUNT_BLOCKED_TITLE}</AlertDialogTitle>
						<AlertDialogDescription>
							{TEST_ACCOUNT_BLOCKED_DESCRIPTION}{" "}
							<a
								href={`mailto:${TEST_ACCOUNT_BLOCKED_SUPPORT_EMAIL}`}
								className="font-medium text-foreground underline underline-offset-2"
							>
								{TEST_ACCOUNT_BLOCKED_SUPPORT_EMAIL}
							</a>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction>Okay</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
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
