import { PlayIcon, WarningIcon } from "@phosphor-icons/react";
import { getV2ErrorMessage } from "@verifyafrica/api-client/http/shared";
import {
	TM_OUTCOMES,
	type TmOutcome,
	type TmScoreResult,
} from "@verifyafrica/api-client/http/v2/transaction-monitoring/transaction-monitoring.types";
import { Alert, AlertDescription } from "@verifyafrica/ui/components/ui/alert";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@verifyafrica/ui/components/ui/card";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import { cn } from "@verifyafrica/ui/lib/utils";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	useTmMonitorsV2Query,
	useTmMonitorV2Query,
	useTmOutcomeV2Mutation,
	useTmScoreV2Mutation,
} from "#/api/http/v2/transaction-monitoring/transaction-monitoring.hooks";
import {
	formatFieldLabel,
	PLAYGROUND_FIELD_TYPES,
	PLAYGROUND_PLACEHOLDERS,
	titleCase,
	VERDICT_BADGE_CLASS,
} from "../-data";

export function PlaygroundTab({ tenantId }: { tenantId: string }) {
	const monitorsQuery = useTmMonitorsV2Query(tenantId, { status: "active" });
	const monitors = monitorsQuery.data?.monitors ?? [];

	const [monitorId, setMonitorId] = useState<string>("");
	const selectedMonitorId =
		monitorId ||
		monitors.find((m) => m.is_default)?.monitor_id ||
		monitors[0]?.monitor_id ||
		"";
	const monitorQuery = useTmMonitorV2Query(
		tenantId,
		selectedMonitorId || undefined,
	);

	const [values, setValues] = useState<Record<string, string>>({
		currency: "NGN",
	});
	const [result, setResult] = useState<TmScoreResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const scoreMutation = useTmScoreV2Mutation(tenantId);
	const outcomeMutation = useTmOutcomeV2Mutation(tenantId);
	const [recordedOutcome, setRecordedOutcome] = useState<TmOutcome | null>(
		null,
	);

	// `amount` and `currency` are always required; the rest come from the monitor.
	const fields = useMemo(
		() => monitorQuery.data?.data_contract ?? ["amount", "currency"],
		[monitorQuery.data?.data_contract],
	);

	function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);

		const payload: Record<string, unknown> = { monitor_id: selectedMonitorId };
		for (const field of fields) {
			const raw = (values[field] ?? "").trim();
			if (!raw) continue;
			if (PLAYGROUND_FIELD_TYPES[field] === "number") {
				const parsed = Number(raw);
				if (Number.isNaN(parsed)) {
					setError(`${formatFieldLabel(field)} must be a number.`);
					return;
				}
				payload[field] = parsed;
			} else {
				payload[field] = raw;
			}
		}

		if (payload.amount === undefined || !payload.currency) {
			setError("Amount and currency are required.");
			return;
		}

		scoreMutation.mutate(payload as { amount: number; currency: string }, {
			onSuccess: (data) => {
				setResult(data);
				setRecordedOutcome(null);
			},
			onError: (err) => {
				const message = getV2ErrorMessage(err, "Scoring failed.");
				setError(message);
				toast.error(message);
			},
		});
	}

	function handleOutcome(outcome: TmOutcome) {
		if (!result) return;
		outcomeMutation.mutate(
			{ transaction_id: result.transaction_id, outcome },
			{
				onSuccess: () => {
					setRecordedOutcome(outcome);
					toast.success("Outcome recorded");
				},
				onError: (err) =>
					toast.error(getV2ErrorMessage(err, "Failed to record outcome.")),
			},
		);
	}

	if (monitorsQuery.isPending) {
		return (
			<p className="py-12 text-center text-sm text-muted-foreground">
				Loading…
			</p>
		);
	}

	if (monitors.length === 0) {
		return (
			<Card>
				<CardContent className="py-12 text-center text-sm text-muted-foreground">
					Create an active monitor first, then come back to try scoring a
					transaction.
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h2 className="text-lg font-semibold tracking-tight">Test a score</h2>
				<p className="max-w-2xl text-sm text-muted-foreground">
					Send a sample transaction through a monitor. Scores here are real
					requests: they&apos;re stored and can open cases.
				</p>
			</div>

			<div className="grid items-start gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Transaction</CardTitle>
						<CardDescription>
							Fields come from the selected monitor&apos;s data contract.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form
							onSubmit={handleSubmit}
							className="flex flex-col gap-4"
							noValidate
						>
							<div className="flex flex-col gap-2">
								<Label htmlFor="tm-play-monitor">Monitor</Label>
								<Select
									value={selectedMonitorId}
									onValueChange={(v) => {
										setMonitorId(v);
										setResult(null);
									}}
								>
									<SelectTrigger id="tm-play-monitor" className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{monitors.map((monitor) => (
											<SelectItem
												key={monitor.monitor_id}
												value={monitor.monitor_id}
											>
												{monitor.display_name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								{fields.map((field) => (
									<div key={field} className="flex flex-col gap-2">
										<Label htmlFor={`tm-play-${field}`}>
											{formatFieldLabel(field)}
										</Label>
										<Input
											id={`tm-play-${field}`}
											inputMode={
												PLAYGROUND_FIELD_TYPES[field] === "number"
													? "decimal"
													: undefined
											}
											value={values[field] ?? ""}
											placeholder={PLAYGROUND_PLACEHOLDERS[field]}
											onChange={(event) =>
												setValues((current) => ({
													...current,
													[field]: event.target.value,
												}))
											}
										/>
									</div>
								))}
							</div>

							{error && (
								<Alert variant="destructive">
									<WarningIcon />
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}

							<Button
								type="submit"
								disabled={scoreMutation.isPending || monitorQuery.isPending}
							>
								<PlayIcon weight="fill" />
								{scoreMutation.isPending ? "Scoring…" : "Score transaction"}
							</Button>
						</form>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Result</CardTitle>
					</CardHeader>
					<CardContent>
						{!result ? (
							<p className="py-10 text-center text-sm text-muted-foreground">
								Score a transaction to see the verdict here.
							</p>
						) : (
							<div className="flex flex-col gap-5">
								<div className="flex items-center justify-between gap-3">
									<Badge
										variant="outline"
										className={cn(
											"px-3 py-1 text-sm",
											VERDICT_BADGE_CLASS[result.verdict],
										)}
									>
										{titleCase(result.verdict)}
									</Badge>
									<span className="font-mono text-xs text-muted-foreground">
										{result.transaction_id}
									</span>
								</div>

								<dl className="grid grid-cols-3 gap-3 text-center">
									{[
										["Rule", result.rule_score],
										["AI", result.ai_score],
										["Overall", result.overall_score],
									].map(([label, score]) => (
										<div
											key={label as string}
											className="rounded-lg border p-3"
										>
											<dt className="text-xs text-muted-foreground">{label}</dt>
											<dd className="text-xl font-semibold tabular-nums">
												{score ?? "—"}
											</dd>
										</div>
									))}
								</dl>

								{result.reasons.length > 0 && (
									<div className="flex flex-col gap-2">
										<p className="text-xs font-medium">Why</p>
										<ul className="flex flex-col gap-1 text-sm">
											{result.reasons.map((reason) => (
												<li
													key={reason.signal}
													className="flex justify-between gap-3"
												>
													<span>{reason.signal}</span>
													<span className="text-muted-foreground tabular-nums">
														+{reason.contribution}
													</span>
												</li>
											))}
										</ul>
									</div>
								)}

								{result.ctr?.reportable && (
									<Alert>
										<WarningIcon />
										<AlertDescription>
											This transaction is reportable as a CTR (threshold{" "}
											{result.ctr.threshold?.toLocaleString()}{" "}
											{result.ctr.currency}).
										</AlertDescription>
									</Alert>
								)}

								<div className="flex flex-col gap-2 border-t pt-4">
									<p className="text-xs font-medium">
										{recordedOutcome
											? `Outcome recorded: ${titleCase(recordedOutcome)}`
											: "What actually happened?"}
									</p>
									<div className="flex flex-wrap gap-2">
										{TM_OUTCOMES.map((outcome) => (
											<Button
												key={outcome}
												type="button"
												size="sm"
												variant={
													recordedOutcome === outcome ? "default" : "outline"
												}
												disabled={outcomeMutation.isPending}
												onClick={() => handleOutcome(outcome)}
											>
												{titleCase(outcome)}
											</Button>
										))}
									</div>
									<p className="text-xs text-muted-foreground">
										Reporting outcomes teaches the model. Do this for real
										transactions too.
									</p>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
