import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { format, startOfDay, subDays } from "date-fns";
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

type ExportTransactionsDialogProps = ComponentProps<typeof Dialog> & {
	tenantId: string;
	tenantCreatedAt?: Date;
};

function formatIsoDate(value: Date) {
	return format(value, "yyyy-MM-dd");
}

export function ExportTransactionsDialog({
	open,
	onOpenChange,
	tenantId,
	tenantCreatedAt,
}: ExportTransactionsDialogProps) {
	const today = startOfDay(new Date());
	const minDate = tenantCreatedAt
		? startOfDay(tenantCreatedAt)
		: undefined;
	const [dateRange, setDateRange] = useState<DateRange | undefined>({
		from: subDays(today, 7),
		to: today,
	});
	const exportMutation = useExportWalletTransactionsV2Mutation();

	useEffect(() => {
		if (!open) return;
		const nextToday = startOfDay(new Date());
		const fromCandidate = subDays(nextToday, 7);
		setDateRange({
			from:
				minDate && fromCandidate < minDate ? minDate : fromCandidate,
			to: nextToday,
		});
	}, [open, minDate]);

	async function handleExport() {
		if (!dateRange?.from || !dateRange?.to) {
			toast.error("Select a valid date range to export");
			return;
		}

		const createdFrom = formatIsoDate(dateRange.from);
		const createdTo = formatIsoDate(dateRange.to);

		try {
			await exportMutation.mutateAsync({
				tenantId,
				params: {
					created_from: createdFrom,
					created_to: createdTo,
				},
			});
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
							onSelect={setDateRange}
							defaultMonth={dateRange?.from}
							disabled={{
								...(minDate ? { before: minDate } : {}),
								after: today,
							}}
							captionLayout="dropdown"
						/>
					</div>
					{minDate ? (
						<p className="text-xs text-muted-foreground">
							Available from {formatIsoDate(minDate)} to{" "}
							{formatIsoDate(today)}
						</p>
					) : null}
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange?.(false)}
					>
						Cancel
					</Button>
					<Button
						type="button"
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
