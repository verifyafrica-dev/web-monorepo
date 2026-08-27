import { ArrowsClockwiseIcon, CodeIcon, EyeIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";

import {
	useRetryTenantWebhookEventV2Mutation,
	useTenantWebhookEventsV2Query,
} from "#/api/http/v2/tenants/tenants.hooks";
import type { TenantWebhookEvent } from "#/api/http/v2/tenants/tenants.types";
import {
	TablePagination,
	TablePaginationSkeleton,
} from "@verifyafrica/ui/components/ui-extended/table-pagination";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@verifyafrica/ui/components/ui/card";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@verifyafrica/ui/components/ui/table";
import { cn } from "@verifyafrica/ui/lib/utils";
import { useCurrentTenant } from "../../team/-data";
import {
	formatWebhookEventDate,
	getWebhookDeliveryStatusClassName,
	getWebhookDeliveryStatusLabel,
	WEBHOOK_EVENTS_PAGE_SIZE,
} from "../-data";
import { WebhookPayloadDialog } from "./webhook-payload-dialog";

function canRetryWebhookDelivery(status: TenantWebhookEvent["status"]) {
	return status === "failure";
}

export function WebhookDeliveriesTab() {
	const [page, setPage] = useState(1);
	const [selectedEvent, setSelectedEvent] = useState<TenantWebhookEvent | null>(
		null,
	);
	const [retryingEventId, setRetryingEventId] = useState<string | null>(null);
	const { tenantId } = useCurrentTenant();

	const eventsQuery = useTenantWebhookEventsV2Query(
		tenantId,
		{ page, per_page: WEBHOOK_EVENTS_PAGE_SIZE },
		Boolean(tenantId),
	);
	const retryMutation = useRetryTenantWebhookEventV2Mutation(tenantId ?? "");

	const events = eventsQuery.data?.items ?? [];
	const total = eventsQuery.data?.meta.pagination.total ?? 0;
	const isLoading = eventsQuery.isPending || eventsQuery.isFetching;

	async function handleRetry(event: TenantWebhookEvent) {
		if (!tenantId) {
			return;
		}

		setRetryingEventId(event.id);
		try {
			await retryMutation.mutateAsync(event.id);
			toast.success("Webhook delivery retry queued.");
		} catch {
			toast.error("Failed to retry webhook delivery. Please try again.");
		} finally {
			setRetryingEventId(null);
		}
	}

	if (eventsQuery.isError) {
		return (
			<Card>
				<CardContent className="py-10 text-center text-sm text-muted-foreground">
					Failed to load webhook deliveries. Please try again.
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-start gap-3">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
							<CodeIcon className="size-5 text-muted-foreground" />
						</div>
						<div>
							<CardTitle className="font-semibold">
								Webhook deliveries
							</CardTitle>
							<CardDescription>
								Outbound payloads sent to your webhook endpoint
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					{isLoading ? (
						<>
							<div className="overflow-hidden rounded-lg border">
								<div className="space-y-0">
									{["row-1", "row-2", "row-3", "row-4", "row-5"].map((row) => (
										<div
											key={row}
											className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0"
										>
											<Skeleton className="h-4 w-36" />
											<Skeleton className="h-4 w-40" />
											<Skeleton className="h-5 w-20 rounded-full" />
											<Skeleton className="h-4 w-10" />
											<Skeleton className="ml-auto size-8 rounded-md" />
										</div>
									))}
								</div>
							</div>
							<TablePaginationSkeleton />
						</>
					) : (
						<>
							<div className="overflow-hidden rounded-lg border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className=" pl-4">Created</TableHead>
											<TableHead>Event</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Retries</TableHead>
											<TableHead className="w-28 text-right pr-4">
												Actions
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{events.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={5}
													className="py-10 text-center text-sm text-muted-foreground"
												>
													No webhook deliveries yet.
												</TableCell>
											</TableRow>
										) : (
											events.map((event) => (
												<TableRow key={event.id}>
													<TableCell className="whitespace-nowrap text-sm pl-4">
														{formatWebhookEventDate(event.created_at)}
													</TableCell>
													<TableCell className="font-mono text-sm">
														{event.event}
													</TableCell>
													<TableCell>
														<Badge
															variant="outline"
															className={cn(
																getWebhookDeliveryStatusClassName(event.status),
															)}
														>
															{getWebhookDeliveryStatusLabel(event.status)}
														</Badge>
													</TableCell>
													<TableCell className="tabular-nums">
														{event.retry_count}
													</TableCell>
													<TableCell className="text-right pr-4">
														<div className="flex items-center justify-end gap-1">
															{canRetryWebhookDelivery(event.status) ? (
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	className="cursor-pointer"
																	aria-label="Retry delivery"
																	disabled={retryingEventId === event.id}
																	onClick={() => void handleRetry(event)}
																>
																	<ArrowsClockwiseIcon
																		className={cn(
																			"size-4",
																			retryingEventId === event.id &&
																				"animate-spin",
																		)}
																	/>
																</Button>
															) : null}
															<Button
																type="button"
																variant="ghost"
																size="icon"
																className="cursor-pointer"
																aria-label="View payload"
																onClick={() => setSelectedEvent(event)}
															>
																<EyeIcon className="size-4" />
															</Button>
														</div>
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</div>
							<TablePagination
								page={page}
								pageSize={WEBHOOK_EVENTS_PAGE_SIZE}
								total={total}
								onPageChange={setPage}
							/>
						</>
					)}
				</CardContent>
			</Card>

			<WebhookPayloadDialog
				event={selectedEvent}
				onOpenChange={(open) => {
					if (!open) {
						setSelectedEvent(null);
					}
				}}
			/>
		</>
	);
}
