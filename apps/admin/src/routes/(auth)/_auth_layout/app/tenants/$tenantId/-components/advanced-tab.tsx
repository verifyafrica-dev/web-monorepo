import { TrashIcon, WarningIcon } from "@phosphor-icons/react";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@verifyafrica/ui/components/ui/card";

export function AdvancedTab({ onDeleteTenant }: { onDeleteTenant: () => void }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="font-semibold">Advanced Settings</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="rounded-lg border border-red-200 bg-red-50 p-6">
					<div className="flex items-start gap-4">
						<WarningIcon className="mt-0.5 size-6 shrink-0 text-red-600" weight="fill" />
						<div className="space-y-4">
							<div>
								<h3 className="text-lg font-semibold text-red-900">
									Danger Zone
								</h3>
								<p className="mt-2 text-sm text-red-700">
									Deleting a tenant is a permanent action and cannot be undone.
									All associated data, including users, transactions, invoices,
									and compliance information will be permanently deleted.
								</p>
							</div>
							<Button variant="destructive" onClick={onDeleteTenant}>
								<TrashIcon />
								Delete Tenant
							</Button>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
