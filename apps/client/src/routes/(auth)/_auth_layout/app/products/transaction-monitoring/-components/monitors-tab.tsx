import { CopyIcon, PlusIcon, StarIcon } from "@phosphor-icons/react";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@verifyafrica/ui/components/ui/table";
import { useClipboard } from "@verifyafrica/ui/hooks/use-clipboard";
import { createSkeletonKeys } from "@verifyafrica/ui/lib/skeleton-keys";
import { cn } from "@verifyafrica/ui/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { useTmMonitorsV2Query } from "#/api/http/v2/transaction-monitoring/transaction-monitoring.hooks";
import {
	formatDateTime,
	formatEventLabel,
	MONITOR_STATUS_BADGE_CLASS,
	titleCase,
} from "../-data";
import { MonitorDetailSheet } from "./monitor-detail-sheet";

export function MonitorsTab({
	tenantId,
	onCreate,
}: {
	tenantId: string;
	onCreate: () => void;
}) {
	const monitorsQuery = useTmMonitorsV2Query(tenantId);
	const [openMonitorId, setOpenMonitorId] = useState<string | null>(null);
	const { copy } = useClipboard();

	const monitors = monitorsQuery.data?.monitors ?? [];

	async function handleCopy(event: React.MouseEvent, monitorId: string) {
		event.stopPropagation();
		await copy(monitorId);
		toast.success("Monitor ID copied");
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex flex-col gap-1">
					<h2 className="text-lg font-semibold tracking-tight">My monitors</h2>
					<p className="max-w-2xl text-sm text-muted-foreground">
						Each monitor is a set of weighted rules. Pass its ID when you score
						a transaction, or mark one as default to use it automatically.
					</p>
				</div>
				<Button onClick={onCreate}>
					<PlusIcon weight="bold" />
					New monitor
				</Button>
			</div>

			<Card>
				<CardContent className="pt-6">
					{monitorsQuery.isPending ? (
						<div className="space-y-3">
							{createSkeletonKeys(4, "tm-monitor-row").map((key) => (
								<Skeleton key={key} className="h-14 rounded-lg" />
							))}
						</div>
					) : monitorsQuery.isError ? (
						<p className="py-12 text-center text-sm text-destructive">
							Unable to load monitors. Please try again.
						</p>
					) : monitors.length === 0 ? (
						<div className="flex flex-col items-center gap-3 py-12 text-center">
							<p className="text-sm text-muted-foreground">
								You haven&apos;t created a monitor yet.
							</p>
							<Button variant="outline" onClick={onCreate}>
								<PlusIcon />
								Create your first monitor
							</Button>
						</div>
					) : (
						<div className="overflow-x-auto rounded-lg border">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/40 hover:bg-muted/40">
										{[
											"Name",
											"Event",
											"Region",
											"Features",
											"Status",
											"Created",
											"",
										].map((heading) => (
											<TableHead
												key={heading || "actions"}
												className="text-xs font-medium tracking-wide uppercase"
											>
												{heading}
											</TableHead>
										))}
									</TableRow>
								</TableHeader>
								<TableBody>
									{monitors.map((monitor) => (
										<TableRow
											key={monitor.monitor_id}
											className="cursor-pointer"
											onClick={() => setOpenMonitorId(monitor.monitor_id)}
										>
											<TableCell>
												<div className="flex items-center gap-2">
													<span className="font-medium">
														{monitor.display_name}
													</span>
													{monitor.is_default && (
														<Badge
															variant="secondary"
															className="gap-1 font-normal"
														>
															<StarIcon weight="fill" className="size-3" />
															Default
														</Badge>
													)}
												</div>
											</TableCell>
											<TableCell>{formatEventLabel(monitor.event)}</TableCell>
											<TableCell>{monitor.region}</TableCell>
											<TableCell className="tabular-nums">
												{monitor.feature_count}
											</TableCell>
											<TableCell>
												<Badge
													variant="outline"
													className={cn(
														MONITOR_STATUS_BADGE_CLASS[monitor.status],
													)}
												>
													{titleCase(monitor.status)}
												</Badge>
											</TableCell>
											<TableCell className="whitespace-nowrap text-muted-foreground">
												{formatDateTime(monitor.created_at)}
											</TableCell>
											<TableCell className="text-right">
												<Button
													variant="ghost"
													size="icon-sm"
													aria-label={`Copy ID for ${monitor.display_name}`}
													onClick={(event) =>
														void handleCopy(event, monitor.monitor_id)
													}
												>
													<CopyIcon className="size-4" />
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			<MonitorDetailSheet
				tenantId={tenantId}
				monitorId={openMonitorId}
				onOpenChange={(open) => {
					if (!open) setOpenMonitorId(null);
				}}
			/>
		</div>
	);
}
