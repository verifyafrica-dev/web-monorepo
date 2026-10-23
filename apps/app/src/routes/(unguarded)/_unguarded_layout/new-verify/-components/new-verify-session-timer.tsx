import { TimerIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import { cn } from "@verifyafrica/ui/lib/utils";

type NewVerifySessionTimerProps = {
	expiresAt: string | null | undefined;
	className?: string;
};

function formatRemaining(totalSeconds: number) {
	const clamped = Math.max(0, totalSeconds);
	const hours = Math.floor(clamped / 3600);
	const minutes = Math.floor((clamped % 3600) / 60);
	const seconds = clamped % 60;

	if (hours > 0) {
		return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
	}

	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function NewVerifySessionTimer({
	expiresAt,
	className,
}: NewVerifySessionTimerProps) {
	const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

	useEffect(() => {
		if (!expiresAt) {
			setRemainingSeconds(null);
			return;
		}

		const expiresMs = Date.parse(expiresAt);
		if (Number.isNaN(expiresMs)) {
			setRemainingSeconds(null);
			return;
		}

		const tick = () => {
			setRemainingSeconds(Math.max(0, Math.ceil((expiresMs - Date.now()) / 1000)));
		};

		tick();
		const intervalId = window.setInterval(tick, 1000);
		return () => window.clearInterval(intervalId);
	}, [expiresAt]);

	if (remainingSeconds === null) {
		return null;
	}

	const isUrgent = remainingSeconds <= 5 * 60;
	const isExpired = remainingSeconds <= 0;

	return (
		<div
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums",
				isExpired || isUrgent
					? "bg-destructive/10 text-destructive"
					: "bg-muted text-muted-foreground",
				className,
			)}
			aria-live="polite"
		>
			<TimerIcon className="size-3.5 shrink-0" weight="bold" />
			<span>
				{isExpired ? "Expired" : `Time left ${formatRemaining(remainingSeconds)}`}
			</span>
		</div>
	);
}
