import { FlaskIcon } from "@phosphor-icons/react";
import { getV2ErrorMessage } from "@verifyafrica/api-client/http/shared";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import { Switch } from "@verifyafrica/ui/components/ui/switch";
import { toast } from "sonner";
import {
	useTenantTestAccessV2Query,
	useUpdateTenantTestAccessV2Mutation,
} from "#/api/http/v2/tenants/tenants.hooks";
import { env } from "#/config/env";

export function TenantTestAccessSection({
	tenantId,
	tenantName,
}: {
	tenantId: string;
	tenantName: string;
}) {
	const canManage = env.envState === "production";
	const query = useTenantTestAccessV2Query(tenantId);
	const mutation = useUpdateTenantTestAccessV2Mutation(tenantId);

	const enabled = query.data?.test_access_enabled ?? false;

	async function handleToggle(next: boolean) {
		if (!canManage || mutation.isPending) return;
		try {
			await mutation.mutateAsync({ test_access_enabled: next });
			toast.success(
				next
					? `Test access enabled for ${tenantName}`
					: `Test access disabled for ${tenantName}`,
			);
		} catch (error) {
			toast.error(getV2ErrorMessage(error) || "Failed to update test access");
		}
	}

	return (
		<div className="space-y-4 rounded-lg border p-4">
			<div className="flex items-start gap-3">
				<FlaskIcon className="mt-0.5 size-5 shrink-0 text-amber-600" weight="duotone" />
				<div className="min-w-0 flex-1 space-y-1">
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="text-sm font-semibold">Test account access</h3>
						{canManage ? (
							<Badge variant={enabled ? "default" : "secondary"}>
								{enabled ? "Enabled" : "Disabled"}
							</Badge>
						) : (
							<Badge variant="outline">Production only</Badge>
						)}
					</div>
					{canManage ? (
						<p className="text-sm text-muted-foreground">
							When enabled, members of this organization can switch from Live to
							their linked Test account. New production signups create a Test twin
							with access disabled until you enable it here.
						</p>
					) : (
						<p className="text-sm text-muted-foreground">
							Test access control only applies on production. Sandbox and dev
							already run against the test API, so this toggle is unavailable here
							({env.envState}).
						</p>
					)}
				</div>
			</div>

			{query.isPending && canManage ? (
				<Skeleton className="h-10 w-full" />
			) : (
				<Field orientation="horizontal" className="items-center justify-between">
					<FieldContent>
						<FieldLabel htmlFor={`test-access-${tenantId}`}>
							Allow Live → Test switching
						</FieldLabel>
						<FieldDescription>
							{canManage
								? "Members see a request-access message when this is off."
								: "Greyed out outside production."}
						</FieldDescription>
					</FieldContent>
					<Switch
						id={`test-access-${tenantId}`}
						checked={canManage ? enabled : false}
						disabled={!canManage || mutation.isPending || query.isPending}
						onCheckedChange={(checked) => void handleToggle(checked)}
					/>
				</Field>
			)}
		</div>
	);
}
