import { DownloadSimpleIcon, FileTextIcon } from "@phosphor-icons/react";
import { type ComponentProps, useRef } from "react";

import { useTenantInvoiceDetailV2Query } from "#/api/http/v2/billing/billing.hooks";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@verifyafrica/ui/components/ui/dialog";
import { Separator } from "@verifyafrica/ui/components/ui/separator";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import { useBrandedPdfDownload } from "#/hooks/use-branded-pdf-download";
import { cn } from "#/lib/utils.ts";
import {
	formatInvoiceAmount,
	formatInvoiceDate,
	getInvoiceFilename,
	getInvoicePaymentStatusBadgeClassName,
} from "../-data";

type InvoiceDetailsDialogProps = ComponentProps<typeof Dialog> & {
	tenantId?: string;
	invoiceId: string | null;
	fallbackCurrency?: string;
};

export function InvoiceDetailsDialog({
	open,
	onOpenChange,
	tenantId,
	invoiceId,
	fallbackCurrency = "USD",
}: InvoiceDetailsDialogProps) {
	const invoiceRef = useRef<HTMLDivElement>(null);
	const { downloadPdf, isDownloading } = useBrandedPdfDownload(invoiceRef);

	const invoiceQuery = useTenantInvoiceDetailV2Query(
		tenantId,
		invoiceId ?? undefined,
		open && Boolean(invoiceId),
	);

	const invoice = invoiceQuery.data;
	const currency = invoice?.currency ?? fallbackCurrency;
	const isLoading = invoiceQuery.isPending || invoiceQuery.isFetching;
	const hasError = invoiceQuery.isError;

	async function handleDownloadInvoice() {
		if (!invoice) return;
		await downloadPdf({
			filename: `invoice-${getInvoiceFilename(invoice)}.pdf`,
		});
	}

	return (
		<Dialog
			open={open && Boolean(invoiceId)}
			onOpenChange={onOpenChange}
		>
			<DialogContent className="sm:max-w-lg">
				{isLoading ? (
					<InvoiceDetailsSkeleton />
				) : hasError || !invoice ? (
					<div className="flex flex-col gap-4 py-6">
						<DialogHeader>
							<DialogTitle>Invoice Details</DialogTitle>
						</DialogHeader>
						<p className="text-sm text-muted-foreground">
							Failed to load invoice details. Please try again.
						</p>
					</div>
				) : (
					<>
						<div
							ref={invoiceRef}
							className="flex flex-col gap-6 bg-popover"
						>
							<DialogHeader>
								<div className="flex items-start gap-3">
									<FileTextIcon
										className="mt-0.5 size-5 text-primary"
										weight="duotone"
									/>
									<div className="flex flex-col gap-2">
										<DialogTitle className="font-semibold">
											Invoice Details
										</DialogTitle>
										<Badge
											variant="outline"
											className={cn(
												"w-fit uppercase",
												getInvoicePaymentStatusBadgeClassName(
													invoice.payment_status,
												),
											)}
										>
											{invoice.payment_status ?? "unknown"}
										</Badge>
									</div>
								</div>
							</DialogHeader>

							<div className="rounded-lg border px-6 py-8 text-center">
								<p className="text-sm text-muted-foreground">Amount</p>
								<p className="mt-1 text-4xl font-semibold tracking-tight text-primary">
									{formatInvoiceAmount(invoice.total_amount, currency)}
								</p>
							</div>

							<div className="flex flex-col gap-4">
								<div>
									<h3 className="mb-2 font-medium">Invoice Information</h3>
									<div className="space-y-1 text-sm">
										<DetailRow
											label="Invoice Number"
											value={getInvoiceFilename(invoice)}
										/>
										<DetailRow
											label="Description"
											value={invoice.description || "—"}
										/>
										<DetailRow
											label="Created"
											value={formatInvoiceDate(invoice.created_at)}
										/>
										<DetailRow
											label="Due"
											value={formatInvoiceDate(invoice.due_at)}
										/>
										<DetailRow
											label="Paid Amount"
											value={formatInvoiceAmount(invoice.paid_amount, currency)}
										/>
										{invoice.paid_by ? (
											<DetailRow
												label="Paid By"
												value={invoice.paid_by}
											/>
										) : null}
									</div>
								</div>

								{invoice.items.length > 0 ? (
									<>
										<Separator />
										<div>
											<h3 className="mb-2 font-medium">Product Items</h3>
											<div className="space-y-1 text-sm">
												{invoice.items.map((item) => (
													<DetailRow
														key={item.id}
														label={`${item.description}${
															item.quantity && item.quantity > 1
																? ` × ${item.quantity}`
																: ""
														}`}
														value={formatInvoiceAmount(
															item.total_price,
															currency,
														)}
													/>
												))}
											</div>
										</div>
									</>
								) : null}
							</div>
						</div>

						<DialogFooter>
							<Button
								type="button"
								className="cursor-pointer"
								disabled={isDownloading}
								onClick={() => {
									void handleDownloadInvoice();
								}}
							>
								<DownloadSimpleIcon className="size-4" />
								{isDownloading ? "Downloading..." : "Download Invoice"}
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}

function InvoiceDetailsSkeleton() {
	const createSkeletonItems = (count: number) =>
		Array.from({ length: count }, (_, i) => i);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-start gap-3">
				<Skeleton className="mt-0.5 size-5 rounded-md" />
				<div className="flex flex-col gap-2">
					<Skeleton className="h-6 w-40" />
					<Skeleton className="h-5 w-20 rounded-full" />
				</div>
			</div>

			<div className="rounded-lg border px-6 py-8 text-center">
				<Skeleton className="mx-auto h-4 w-16" />
				<Skeleton className="mx-auto mt-3 h-10 w-32" />
			</div>

			<div className="space-y-3">
				<Skeleton className="h-5 w-44" />
				{createSkeletonItems(5).map((index) => (
					<div
						key={`invoice-detail-skel-${index}`}
						className="flex items-center justify-between gap-4 py-2"
					>
						<Skeleton className="h-4 w-28" />
						<Skeleton className="h-4 w-24" />
					</div>
				))}
			</div>

			<div className="space-y-3">
				<Skeleton className="h-px w-full" />
				<Skeleton className="h-5 w-28" />
				{createSkeletonItems(3).map((index) => (
					<div
						key={`invoice-item-skel-${index}`}
						className="flex items-center justify-between gap-4 py-2"
					>
						<Skeleton className="h-4 w-40" />
						<Skeleton className="h-4 w-16" />
					</div>
				))}
			</div>
		</div>
	);
}

function DetailRow({
	label,
	value,
	valueClassName,
}: {
	label: string;
	value: string;
	valueClassName?: string;
}) {
	return (
		<div className="flex items-start justify-between gap-4 py-2 text-sm">
			<span className="text-muted-foreground">{label}</span>
			<span className={cn("text-right font-medium", valueClassName)}>
				{value}
			</span>
		</div>
	);
}
