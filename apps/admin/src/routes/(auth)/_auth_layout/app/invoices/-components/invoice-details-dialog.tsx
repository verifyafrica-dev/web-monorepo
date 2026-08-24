import { DownloadSimpleIcon } from "@phosphor-icons/react";
import type { Invoice } from "#/api/http/v2/billing/billing.types";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@verifyafrica/ui/components/ui/table";
import { cn } from "#/lib/utils";
import {
	formatInvoiceLongDate,
	getInvoiceBalanceDue,
	getInvoiceLabel,
	getPaymentStatusBadgeClass,
	getPaymentStatusLabel,
	downloadInvoice,
} from "../-data";
import {
	formatTenantMoney,
	getInvoiceTotalAmount,
} from "../../tenants/$tenantId/-data";

export function InvoiceDetailsDialog({
	open,
	invoice,
	onOpenChange,
}: {
	open: boolean;
	invoice: Invoice | null;
	onOpenChange: (open: boolean) => void;
}) {
	if (!invoice) {
		return null;
	}

	const currency = invoice.currency ?? "USD";
	const totalAmount = getInvoiceTotalAmount(invoice);
	const paidAmount = invoice.paid_amount ?? "0";
	const balanceDue = getInvoiceBalanceDue(invoice);
	const invoiceLabel = getInvoiceLabel(invoice);

	const handleDownload = () => {
		if (!downloadInvoice(invoice)) {
			return;
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
				<DialogHeader className="gap-3 border-b px-6 py-4 text-left">
					<div className="flex items-start justify-between gap-4">
						<div className="space-y-2">
							<DialogTitle className="text-lg font-semibold">
								Invoice {invoiceLabel}
							</DialogTitle>
							<Badge
								variant="outline"
								className={getPaymentStatusBadgeClass(invoice.payment_status)}
							>
								{getPaymentStatusLabel(invoice.payment_status)}
							</Badge>
						</div>
					</div>
				</DialogHeader>

				<div className="overflow-y-auto px-6 py-4">
					<section className="rounded-lg border p-4">
						<h3 className="text-sm font-semibold">Invoice Information</h3>
						<Separator className="my-3" />

						<div className="grid gap-4 sm:grid-cols-2">
							<DetailField
								label="Tenant ID"
								value={invoice.tenant_slug ?? invoice.tenant}
							/>
							<DetailField
								label="Tenant Email"
								value={invoice.tenant_email ?? "-"}
							/>
							<DetailField label="Currency" value={currency} />
							<DetailField
								label="Created Date"
								value={formatInvoiceLongDate(invoice.created_at)}
							/>
							<DetailField
								label="Due Date"
								value={formatInvoiceLongDate(invoice.due_at)}
							/>
							<div className="space-y-1 sm:col-span-2">
								<p className="text-xs text-muted-foreground">Description</p>
								<p className="text-sm font-medium">
									{invoice.description || "No description provided"}
								</p>
							</div>
						</div>
					</section>

					<section className="mt-6 space-y-3">
						<h3 className="text-sm font-semibold">Invoice Items</h3>

						{invoice.items.length > 0 ? (
							<div className="overflow-hidden rounded-lg border">
								<Table>
									<TableHeader>
										<TableRow className="hover:bg-transparent">
											<TableHead>Description</TableHead>
											<TableHead className="text-right">Quantity</TableHead>
											<TableHead className="text-right">Unit Price</TableHead>
											<TableHead className="text-right">Total</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{invoice.items.map((item) => (
											<TableRow key={item.id}>
												<TableCell>{item.description}</TableCell>
												<TableCell className="text-right">
													{item.quantity ?? "-"}
												</TableCell>
												<TableCell className="text-right">
													{formatTenantMoney(item.unit_price, currency)}
												</TableCell>
												<TableCell className="text-right font-medium">
													{formatTenantMoney(item.total_price, currency)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						) : (
							<p className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
								No items found for this invoice.
							</p>
						)}
					</section>

					<section className="mt-6 rounded-lg border bg-muted/20 p-4">
						<h3 className="text-sm font-semibold">Summary</h3>
						<Separator className="my-3" />

						<div className="space-y-2">
							<SummaryRow
								label="Subtotal"
								value={formatTenantMoney(totalAmount, currency)}
							/>
							<SummaryRow
								label="Total Amount"
								value={formatTenantMoney(totalAmount, currency)}
								valueClassName="font-semibold"
							/>
							<Separator className="my-2" />
							<SummaryRow
								label="Paid Amount"
								value={formatTenantMoney(paidAmount, currency)}
								valueClassName="font-medium text-emerald-600"
							/>
							<div className="flex items-center justify-between border-t pt-3">
								<p className="text-sm font-semibold">Balance Due</p>
								<p
									className={cn(
										"text-sm font-semibold",
										balanceDue > 0 ? "text-red-600" : "text-emerald-600",
									)}
								>
									{formatTenantMoney(balanceDue, currency)}
								</p>
							</div>
						</div>
					</section>

					{invoice.paid_by ? (
						<p className="mt-4 text-xs text-muted-foreground">
							Paid by: {invoice.paid_by}
						</p>
					) : null}
				</div>

				<DialogFooter className="border-t px-6 py-4 sm:justify-end">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Close
					</Button>
					<Button onClick={handleDownload} disabled={!invoice.file_attachment}>
						<DownloadSimpleIcon />
						Download Invoice
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function DetailField({ label, value }: { label: string; value: string }) {
	return (
		<div className="space-y-1">
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className="text-sm font-medium">{value}</p>
		</div>
	);
}

function SummaryRow({
	label,
	value,
	valueClassName,
}: {
	label: string;
	value: string;
	valueClassName?: string;
}) {
	return (
		<div className="flex items-center justify-between gap-4">
			<p className="text-sm text-muted-foreground">{label}</p>
			<p className={cn("text-sm", valueClassName)}>{value}</p>
		</div>
	);
}
