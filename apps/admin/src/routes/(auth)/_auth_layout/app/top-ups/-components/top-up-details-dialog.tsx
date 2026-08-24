import type { WalletTransaction } from "#/api/http/v2/wallet/wallet.types";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@verifyafrica/ui/components/ui/dialog";
import { formatTenantDate } from "../../tenants/-data";
import { formatTenantMoney } from "../../tenants/$tenantId/-data";
import {
	formatTopUpId,
	getTopUpPaymentMethod,
	getTopUpStatusBadgeClass,
	getTopUpStatusLabel,
	getTopUpTenantName,
} from "../-data";

export function TopUpDetailsDialog({
	open,
	transaction,
	onOpenChange,
}: {
	open: boolean;
	transaction: WalletTransaction | null;
	onOpenChange: (open: boolean) => void;
}) {
	if (!transaction) {
		return null;
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<DialogTitle className="font-semibold">
							Top-up {formatTopUpId(transaction)}
						</DialogTitle>
						<Badge variant="outline" className={getTopUpStatusBadgeClass()}>
							{getTopUpStatusLabel()}
						</Badge>
					</div>
				</DialogHeader>

				<div className="grid gap-4 sm:grid-cols-2">
					<DetailField label="Tenant" value={getTopUpTenantName(transaction)} />
					<DetailField
						label="Amount Paid"
						value={formatTenantMoney(transaction.amount)}
					/>
					<DetailField
						label="Payment Method"
						value={getTopUpPaymentMethod(transaction)}
					/>
					<DetailField label="Reference" value={transaction.reference} />
					<DetailField
						label="Date"
						value={formatTenantDate(transaction.created_at)}
					/>
					<DetailField label="Type" value={transaction.type} />
					<DetailField
						label="Balance Before"
						value={formatTenantMoney(transaction.balance_before)}
					/>
					<DetailField
						label="Balance After"
						value={formatTenantMoney(transaction.balance_after)}
					/>
					<div className="space-y-1 sm:col-span-2">
						<p className="text-sm font-medium text-muted-foreground">
							Description
						</p>
						<p className="text-sm">{transaction.reason}</p>
					</div>
					{transaction.metadata ? (
						<div className="space-y-1 sm:col-span-2">
							<p className="text-sm font-medium text-muted-foreground">
								Metadata
							</p>
							<pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 text-xs">
								{JSON.stringify(transaction.metadata, null, 2)}
							</pre>
						</div>
					) : null}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function DetailField({ label, value }: { label: string; value: string }) {
	return (
		<div className="space-y-1">
			<p className="text-sm font-medium text-muted-foreground">{label}</p>
			<p className="text-sm capitalize">{value}</p>
		</div>
	);
}
