import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { format } from "date-fns";
import { type ComponentProps, useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

import { useExportWalletTransactionsV2Mutation } from "#/api/http/v2/wallet/wallet.hooks";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Calendar } from "@verifyafrica/ui/components/ui/calendar";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@verifyafrica/ui/components/ui/dialog";
import { Label } from "@verifyafrica/ui/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@verifyafrica/ui/components/ui/radio-group";
import { cn } from "@verifyafrica/ui/lib/utils";
import {
	downloadTransactionsCsv,
	EXPORT_DURATION_OPTIONS,
	type ExportDurationPreset,
	filterTransactionsByDateRange,
	formatIsoDate,
	getDefaultExportDateRange,
	getExportDateRangeForPreset,
	getExportQueryDates,
} from "../-data";

type ExportTransactionsDialogProps = ComponentProps<typeof Dialog> & {
	accountCreatedAt: Date;
	tenantId?: string;
	currency?: string;
};

export function ExportTransactionsDialog({
	open,
	onOpenChange,
	accountCreatedAt,
	tenantId,
	currency = "USD",
}: ExportTransactionsDialogProps) {
	const [preset, setPreset] = useState<ExportDurationPreset>("custom");
	const [dateRange, setDateRange] = useState<DateRange | undefined>(() =>
		getDefaultExportDateRange(accountCreatedAt),
	);

	const exportMutation = useExportWalletTransactionsV2Mutation();
	const today = new Date();

	useEffect(() => {
		if (!open) {
			return;
		}

		setPreset("custom");
		setDateRange(getDefaultExportDateRange(accountCreatedAt, today));
	}, [open, accountCreatedAt, today]);

	function handlePresetChange(nextPreset: ExportDurationPreset) {
		setPreset(nextPreset);

		if (nextPreset === "custom") {
			return;
		}

		setDateRange(
			getExportDateRangeForPreset(nextPreset, accountCreatedAt, today),
		);
	}

	function handleCalendarSelect(range: DateRange | undefined) {
		setPreset("custom");
		setDateRange(range);
	}

	async function handleExport() {
		const queryDates = getExportQueryDates(dateRange);

		if (!queryDates) {
			toast.error("Select a valid date range to export");
			return;
		}

		if (!tenantId) {
			toast.error("Tenant information is unavailable");
			return;
		}

		try {
			const allTransactions = await exportMutation.mutateAsync({ tenantId });
			const transactions = filterTransactionsByDateRange(
				allTransactions,
				queryDates.from_date,
				queryDates.to_date,
			);

			if (transactions.length === 0) {
				toast.info("No transactions found for the selected date range");
				return;
			}

			const filename = `transactions-${queryDates.from_date}-to-${queryDates.to_date}.csv`;
			downloadTransactionsCsv(transactions, filename, currency);
			toast.success("Transactions exported successfully");
			onOpenChange?.(false);
		} catch {
			toast.error("Failed to export transactions");
		}
	}

	const rangeLabel =
		dateRange?.from && dateRange?.to
			? `${format(dateRange.from, "MMM d, yyyy")} – ${format(dateRange.to, "MMM d, yyyy")}`
			: "Select a date range";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-fit">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<DownloadSimpleIcon className="size-5 text-primary" />
						Export Transactions
					</DialogTitle>
				</DialogHeader>

				<div className="flex flex-col gap-6">
					<div className="space-y-3">
						<Label>Duration</Label>
						<RadioGroup
							value={preset}
							onValueChange={(value) =>
								handlePresetChange(value as ExportDurationPreset)
							}
							className="grid gap-2 sm:grid-cols-2"
						>
							{EXPORT_DURATION_OPTIONS.map((option) => (
								<div
									key={option.value}
									className={cn(
										"flex items-center gap-2 rounded-lg border px-3 py-2",
										preset === option.value && "border-primary bg-primary/5",
									)}
								>
									<RadioGroupItem
										value={option.value}
										id={`export-duration-${option.value}`}
									/>
									<Label
										htmlFor={`export-duration-${option.value}`}
										className="cursor-pointer font-normal"
									>
										{option.label}
									</Label>
								</div>
							))}
						</RadioGroup>
					</div>

					<div className="space-y-3">
						<div className="flex items-center justify-between gap-3">
							<Label>Date range</Label>
							<p className="text-sm text-muted-foreground">{rangeLabel}</p>
						</div>
						<div className="rounded-lg border p-3">
							<Calendar
								mode="range"
								numberOfMonths={2}
								selected={dateRange}
								onSelect={handleCalendarSelect}
								defaultMonth={dateRange?.from}
								disabled={{
									before: accountCreatedAt,
									after: today,
								}}
								captionLayout="dropdown"
							/>
						</div>
						<p className="text-xs text-muted-foreground">
							Available from {formatIsoDate(accountCreatedAt)} to{" "}
							{formatIsoDate(today)}
						</p>
					</div>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						className="cursor-pointer"
						onClick={() => onOpenChange?.(false)}
					>
						Cancel
					</Button>
					<Button
						type="button"
						className="cursor-pointer"
						disabled={
							exportMutation.isPending || !dateRange?.from || !dateRange?.to
						}
						onClick={() => void handleExport()}
					>
						<DownloadSimpleIcon className="size-4" />
						{exportMutation.isPending ? "Exporting..." : "Export CSV"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
