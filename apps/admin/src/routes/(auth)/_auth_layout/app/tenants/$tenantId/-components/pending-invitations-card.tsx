import {
	EnvelopeSimpleIcon,
	MagnifyingGlassIcon,
	PaperPlaneTiltIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getV2ErrorMessage } from "@verifyafrica/api-client/http/shared";
import {
	useDeleteTenantInvitationV2Mutation,
	useResendTenantInvitationV2Mutation,
	useTenantInvitationsV2Query,
} from "#/api/http/v2/tenants/tenants.hooks";
import type { TenantInvitation } from "@verifyafrica/api-client/http/v2/tenants/tenants.types";
import {
	paginateItems,
	TablePagination,
	TablePaginationSkeleton,
} from "@verifyafrica/ui/components/ui-extended/table-pagination";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@verifyafrica/ui/components/ui/alert-dialog";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@verifyafrica/ui/components/ui/card";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@verifyafrica/ui/components/ui/table";
import { useDebouncedValue } from "@verifyafrica/ui/hooks/use-debounced-value";
import { createSkeletonKeys } from "@verifyafrica/ui/lib/skeleton-keys";
import { formatTenantDate } from "../-data";

const PAGE_SIZE = 10;
const INVITATIONS_FETCH_SIZE = 100;
const INVITATION_TABLE_COLUMNS = [
	"Email",
	"Role",
	"Status",
	"Expires",
	"Actions",
] as const;

function matchesInvitationSearch(invitation: TenantInvitation, query: string) {
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) {
		return true;
	}

	return [invitation.email, invitation.name, invitation.role, invitation.status]
		.filter(Boolean)
		.some((value) => value.toLowerCase().includes(normalizedQuery));
}

function getStatusBadgeClassName(status: string) {
	switch (status) {
		case "pending":
			return "border-amber-200 bg-amber-50 text-amber-700";
		case "expired":
			return "border-red-200 bg-red-50 text-red-700";
		case "canceled":
		case "cancelled":
			return "border-muted bg-muted text-muted-foreground";
		case "accepted":
			return "border-emerald-200 bg-emerald-50 text-emerald-700";
		default:
			return "border-muted bg-muted text-muted-foreground";
	}
}

export function PendingInvitationsCard({ tenantId }: { tenantId: string }) {
	const [page, setPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [invitationToCancel, setInvitationToCancel] =
		useState<TenantInvitation | null>(null);
	const [resendingInvitationId, setResendingInvitationId] = useState<
		string | null
	>(null);
	const debouncedSearch = useDebouncedValue(searchQuery, 300);

	const invitationsQuery = useTenantInvitationsV2Query(tenantId, {
		page: 1,
		per_page: INVITATIONS_FETCH_SIZE,
	});
	const resendMutation = useResendTenantInvitationV2Mutation(tenantId);
	const cancelMutation = useDeleteTenantInvitationV2Mutation(tenantId);

	useEffect(() => {
		setPage(1);
	}, []);

	const actionableInvitations = useMemo(() => {
		return (invitationsQuery.data?.items ?? []).filter((invitation) => {
			const status = invitation.status;
			return status === "pending" || status === "expired";
		});
	}, [invitationsQuery.data?.items]);

	const filteredInvitations = useMemo(() => {
		return actionableInvitations.filter((invitation) =>
			matchesInvitationSearch(invitation, debouncedSearch),
		);
	}, [actionableInvitations, debouncedSearch]);

	const { items: paginatedInvitations, total, safePage } = useMemo(
		() => paginateItems(filteredInvitations, page, PAGE_SIZE),
		[filteredInvitations, page],
	);

	const isLoading =
		invitationsQuery.isPending ||
		(invitationsQuery.isFetching && !invitationsQuery.data);
	const isMutating = resendMutation.isPending || cancelMutation.isPending;
	const hasActiveSearch = debouncedSearch.trim().length > 0;

	const handleResend = async (invitation: TenantInvitation) => {
		setResendingInvitationId(invitation.id);
		try {
			await resendMutation.mutateAsync(invitation.id);
			toast.success(`Invitation resent to ${invitation.email}`);
		} catch (error) {
			toast.error(getV2ErrorMessage(error));
		} finally {
			setResendingInvitationId(null);
		}
	};

	const handleCancel = async () => {
		if (!invitationToCancel) {
			return;
		}

		try {
			await cancelMutation.mutateAsync(invitationToCancel.id);
			toast.success(`Invitation canceled for ${invitationToCancel.email}`);
			setInvitationToCancel(null);
		} catch (error) {
			toast.error(getV2ErrorMessage(error));
		}
	};

	return (
		<>
			<Card>
				<CardHeader className="gap-4 border-b">
					<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
						<div className="flex flex-col gap-1">
							<CardTitle className="font-semibold">
								Pending Invitations
							</CardTitle>
							<p className="text-sm text-muted-foreground">
								Users invited to this tenant who have not joined yet
							</p>
						</div>
						<div className="relative w-full sm:w-72">
							<MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={searchQuery}
								onChange={(event) => setSearchQuery(event.target.value)}
								placeholder="Search invitations..."
								className="pl-9"
								disabled={isLoading || isMutating}
							/>
						</div>
					</div>
				</CardHeader>

				<CardContent className="gap-0 p-0">
					{isLoading ? (
						<div className="p-4">
							<InvitationsTableSkeleton />
							<TablePaginationSkeleton />
						</div>
					) : filteredInvitations.length === 0 ? (
						<div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
							<EnvelopeSimpleIcon className="size-10 text-muted-foreground" />
							<p className="text-sm text-muted-foreground">
								{hasActiveSearch
									? "No invitations match your search"
									: "No pending invitations for this tenant"}
							</p>
						</div>
					) : (
						<>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="hover:bg-transparent">
											{INVITATION_TABLE_COLUMNS.map((column, index) => (
												<TableHead
													key={column}
													className={
														index === 0
															? "pl-4 text-xs font-semibold tracking-wide uppercase sm:pl-6"
															: index === INVITATION_TABLE_COLUMNS.length - 1
																? "pr-4 text-right text-xs font-semibold tracking-wide uppercase sm:pr-6"
																: "text-xs font-semibold tracking-wide uppercase"
													}
												>
													{column}
												</TableHead>
											))}
										</TableRow>
									</TableHeader>
									<TableBody>
										{paginatedInvitations.map((invitation) => {
											const canResend =
												invitation.status === "pending" ||
												invitation.status === "expired";

											return (
												<TableRow key={invitation.id}>
													<TableCell className="pl-4 sm:pl-6">
														<div className="flex flex-col gap-0.5">
															<span className="font-medium">
																{invitation.email}
															</span>
															{invitation.name ? (
																<span className="text-sm text-muted-foreground">
																	{invitation.name}
																</span>
															) : null}
														</div>
													</TableCell>
													<TableCell>
														<Badge
															variant="outline"
															className="border-blue-200 bg-blue-50 capitalize text-blue-700"
														>
															{invitation.role}
														</Badge>
													</TableCell>
													<TableCell>
														<Badge
															variant="outline"
															className={`capitalize ${getStatusBadgeClassName(invitation.status)}`}
														>
															{invitation.status === "canceled"
																? "cancelled"
																: invitation.status}
														</Badge>
													</TableCell>
													<TableCell>
														{formatTenantDate(invitation.expires_at)}
													</TableCell>
													<TableCell className="pr-4 text-right sm:pr-6">
														<div className="flex items-center justify-end gap-1">
															{canResend ? (
																<Button
																	variant="ghost"
																	size="icon-sm"
																	disabled={
																		isMutating ||
																		resendingInvitationId === invitation.id
																	}
																	onClick={() => void handleResend(invitation)}
																	aria-label={`Resend invitation to ${invitation.email}`}
																>
																	<PaperPlaneTiltIcon className="size-4" />
																</Button>
															) : null}
															<Button
																variant="ghost"
																size="icon-sm"
																disabled={isMutating}
																onClick={() =>
																	setInvitationToCancel(invitation)
																}
																aria-label={`Cancel invitation for ${invitation.email}`}
															>
																<TrashIcon className="size-4 text-destructive" />
															</Button>
														</div>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>

							<TablePagination
								page={safePage}
								pageSize={PAGE_SIZE}
								total={total}
								onPageChange={setPage}
							/>
						</>
					)}
				</CardContent>
			</Card>

			<AlertDialog
				open={Boolean(invitationToCancel)}
				onOpenChange={(open) => {
					if (!open && !cancelMutation.isPending) {
						setInvitationToCancel(null);
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Cancel invitation?</AlertDialogTitle>
						<AlertDialogDescription>
							This cancels the invitation sent to{" "}
							<strong>{invitationToCancel?.email ?? ""}</strong>. They will no
							longer be able to join with this invite link.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={cancelMutation.isPending}>
							Keep invitation
						</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={(event) => {
								event.preventDefault();
								void handleCancel();
							}}
							disabled={cancelMutation.isPending}
						>
							{cancelMutation.isPending ? "Canceling..." : "Cancel invitation"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

function InvitationsTableSkeleton() {
	return (
		<div className="space-y-3">
			{createSkeletonKeys(4, "tenant-invitation-row").map((key) => (
				<div key={key} className="flex items-center gap-4 px-2">
					<div className="flex-1 space-y-2">
						<Skeleton className="h-4 w-48" />
						<Skeleton className="h-3 w-32" />
					</div>
					<Skeleton className="h-6 w-16" />
					<Skeleton className="h-6 w-20" />
					<Skeleton className="h-4 w-32" />
					<Skeleton className="size-8" />
				</div>
			))}
		</div>
	);
}
