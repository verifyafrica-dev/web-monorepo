import {
	CalendarBlankIcon,
	MagnifyingGlassIcon,
	PaperPlaneTiltIcon,
	TrashIcon,
	UserIcon,
} from "@phosphor-icons/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	useResendTenantInvitationV2Mutation,
	useTenantInvitationsV2Query,
	useTenantV2DetailQuery,
} from "#/api/http/v2/tenants/tenants.hooks";
import {
	TablePagination,
	TablePaginationSkeleton,
} from "@verifyafrica/ui/components/ui-extended/table-pagination";
import { Avatar, AvatarFallback } from "@verifyafrica/ui/components/ui/avatar";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@verifyafrica/ui/components/ui/card";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@verifyafrica/ui/components/ui/table";
import { useDebouncedValue } from "@verifyafrica/ui/hooks/use-debounced-value";
import { cn } from "@verifyafrica/ui/lib/utils";
import { DashboardOnboarding } from "../../-components/dashboard-onboarding";
import { shouldShowDashboardOnboarding } from "../../-data";
import {
	DeleteUserDialog,
	type DeleteUserDialogTarget,
} from "../-components/delete-user-dialog";
import { TeamIconActionButton } from "../-components/team-icon-action-button";
import {
	type TeamMemberDetails,
	TeamMemberDetailsDialog,
} from "../-components/team-member-details-dialog";
import { TeamTableShell } from "../-components/team-table-shell";
import { TeamTableSkeleton } from "../-components/team-table-skeleton";
import {
	TEAM_PAGE_SIZE,
	type TenantUserRole,
	useCurrentTenant,
} from "../-data";
import {
	InvitationRoleBadge,
	InvitationStatusBadge,
} from "./-components/invitation-badges";
import { InviteUserDialog } from "./-components/invite-user-dialog";
import {
	canResendInvitation,
	formatInvitationExpiry,
	INVITATION_ROLES,
	type InvitationStatus,
	mapInvitationsToUserInvitations,
	ROLE_LABELS,
	STATUS_LABELS,
	type UserInvitation,
} from "./-data";

const INVITATION_TABLE_COLUMNS = [
	"User Details",
	"Role",
	"Invitation Status",
	"Expires",
	"Actions",
];

export const Route = createFileRoute(
	"/(auth)/_auth_layout/app/team/invitations/",
)({
	head: () => ({
		meta: [
			{ title: "Invitations | VerifyAfrica" },
			{ name: "description", content: "Manage pending invitations and invite new team members." },
		],
	}),
	component: InvitationsPage,
});

function InvitationsPage() {
	const { tenantId, isTenantAdmin } = useCurrentTenant();
	const tenantQuery = useTenantV2DetailQuery(tenantId, Boolean(tenantId));
	const navigate = useNavigate();
	const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [invitationToDelete, setInvitationToDelete] =
		useState<UserInvitation | null>(null);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<InvitationStatus | "all">(
		"all",
	);
	const [roleFilter, setRoleFilter] = useState<TenantUserRole | "all">("all");
	const [page, setPage] = useState(1);
	const [resendingInvitationId, setResendingInvitationId] = useState<
		string | null
	>(null);
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [selectedMember, setSelectedMember] =
		useState<TeamMemberDetails | null>(null);
	const debouncedSearch = useDebouncedValue(search, 300);
	const isKycVerified = tenantQuery.data?.kyc.kyc_verified ?? false;
	const isKycLoading = tenantQuery.isPending || tenantQuery.isFetching;
	const showOnboarding =
		!tenantQuery.isError &&
		!isKycLoading &&
		shouldShowDashboardOnboarding(isKycVerified);

	useEffect(() => {
		if (!isTenantAdmin) {
			void navigate({ to: "/app/team/active-users", replace: true });
		}
	}, [isTenantAdmin, navigate]);

	const invitationListQuery = useMemo(
		() => ({
			page,
			per_page: TEAM_PAGE_SIZE,
			...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
			...(statusFilter !== "all" ? { status: statusFilter } : {}),
			...(roleFilter !== "all" ? { role: roleFilter } : {}),
		}),
		[page, debouncedSearch, statusFilter, roleFilter],
	);

	const invitationsQuery = useTenantInvitationsV2Query(
		tenantId,
		invitationListQuery,
		Boolean(tenantId) && isTenantAdmin,
	);
	const resendInvitationMutation = useResendTenantInvitationV2Mutation(
		tenantId ?? "",
	);

	useEffect(() => {
		setPage(1);
	}, []);

	const invitations = useMemo(
		() => mapInvitationsToUserInvitations(invitationsQuery.data?.items ?? []),
		[invitationsQuery.data?.items],
	);

	const totalInvitations = invitationsQuery.data?.meta.pagination.total ?? 0;
	const hasActiveFilters =
		debouncedSearch.trim().length > 0 ||
		statusFilter !== "all" ||
		roleFilter !== "all";

	const isLoading =
		invitationsQuery.isPending ||
		(invitationsQuery.isFetching && !invitationsQuery.data);

	function openDeleteDialog(invitation: UserInvitation) {
		setInvitationToDelete(invitation);
		setDeleteDialogOpen(true);
	}

	function openMemberDetails(invitation: UserInvitation) {
		setSelectedMember({ type: "invitation", data: invitation });
		setDetailsOpen(true);
	}

	function handleDeleteSuccess(_target: DeleteUserDialogTarget) {
		setInvitationToDelete(null);
	}

	async function handleResendInvitation(invitation: UserInvitation) {
		if (!tenantId) {
			toast.error("Tenant information is unavailable");
			return;
		}

		setResendingInvitationId(invitation.id);

		try {
			await resendInvitationMutation.mutateAsync(invitation.id);
			toast.success(`Invitation resent to ${invitation.email}`);
		} catch {
			toast.error("Failed to resend invitation. Please try again.");
		} finally {
			setResendingInvitationId(null);
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-semibold tracking-tight">
						User Invitations
					</h1>
					<p className="text-sm text-muted-foreground">
						Manage and track user invitation status
					</p>
				</div>
				<Button
					className="cursor-pointer tracking-wide"
					onClick={() => setInviteDialogOpen(true)}
					disabled={!tenantId || !isTenantAdmin || isLoading}
				>
					Invite User
				</Button>
			</div>

			{showOnboarding && <DashboardOnboarding />}

			<Card className="gap-0 py-4 sm:py-6">
				<CardHeader className="border-b">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<CardTitle className="text-base font-semibold">
							Invitations
						</CardTitle>
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
							<div className="relative min-w-[200px] flex-1 sm:max-w-xs">
								<MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									placeholder="Search invitations..."
									value={search}
									onChange={(event) => {
										setSearch(event.target.value);
									}}
									className="pl-9"
									disabled={isLoading}
								/>
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<Label htmlFor="status-filter" className="sr-only">
									Status
								</Label>
								<Select
									value={statusFilter}
									onValueChange={(value) => {
										setStatusFilter(value as InvitationStatus | "all");
									}}
									disabled={isLoading}
								>
									<SelectTrigger id="status-filter" className="w-[150px]">
										<SelectValue placeholder="Status: All" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Status: All</SelectItem>
										{(Object.keys(STATUS_LABELS) as InvitationStatus[]).map(
											(status) => (
												<SelectItem key={status} value={status}>
													{STATUS_LABELS[status]}
												</SelectItem>
											),
										)}
									</SelectContent>
								</Select>
								<Label htmlFor="role-filter" className="sr-only">
									Role
								</Label>
								<Select
									value={roleFilter}
									onValueChange={(value) => {
										setRoleFilter(value as TenantUserRole | "all");
									}}
									disabled={isLoading}
								>
									<SelectTrigger id="role-filter" className="w-[150px]">
										<SelectValue placeholder="Role: All" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Role: All</SelectItem>
										{INVITATION_ROLES.map((role) => (
											<SelectItem key={role} value={role}>
												{ROLE_LABELS[role]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					{invitationsQuery.isPending ? (
						<TeamTableShell>
							<TeamTableSkeleton columns={INVITATION_TABLE_COLUMNS} />
							<TablePaginationSkeleton />
						</TeamTableShell>
					) : invitationsQuery.isError ? (
						<div className="flex min-h-[320px] items-center justify-center px-6 text-sm text-muted-foreground">
							Failed to load invitations. Please try again.
						</div>
					) : (
						<TeamTableShell>
							<Table
								className={cn(invitations.length === 0 && "h-full flex-1")}
							>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										{INVITATION_TABLE_COLUMNS.map((column, index) => (
											<TableHead
												key={column}
												className={
													index === 0
														? "pl-4 text-xs font-semibold tracking-wide uppercase sm:pl-6"
														: index === INVITATION_TABLE_COLUMNS.length - 1
															? "pr-4 text-xs font-semibold tracking-wide uppercase sm:pr-6"
															: "text-xs font-semibold tracking-wide uppercase"
												}
											>
												{column}
											</TableHead>
										))}
									</TableRow>
								</TableHeader>
								<TableBody>
									{invitations.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={INVITATION_TABLE_COLUMNS.length}
												className="h-24 text-center text-sm text-muted-foreground"
											>
												{hasActiveFilters
													? "No invitations match your search or filters."
													: 'No invitations yet. Click "Invite User" to send one.'}
											</TableCell>
										</TableRow>
									) : (
										invitations.map((invitation) => (
											<TableRow
												key={invitation.id}
												className="cursor-pointer"
												onClick={() => openMemberDetails(invitation)}
											>
												<TableCell className="pl-4 sm:pl-6">
													<div className="flex items-center gap-3">
														<Avatar size="sm">
															<AvatarFallback>
																<UserIcon className="size-4" />
															</AvatarFallback>
														</Avatar>
														<span className="text-sm">{invitation.email}</span>
													</div>
												</TableCell>
												<TableCell>
													<InvitationRoleBadge role={invitation.role} />
												</TableCell>
												<TableCell>
													<InvitationStatusBadge status={invitation.status} />
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-2 text-sm text-muted-foreground">
														<CalendarBlankIcon className="size-4 shrink-0" />
														{formatInvitationExpiry(invitation.expiresAt)}
													</div>
												</TableCell>
												<TableCell className="pr-4 sm:pr-6">
													{isTenantAdmin && (
														<div className="flex items-center gap-1">
															{canResendInvitation(invitation.status) && (
																<TeamIconActionButton
																	label={
																		resendingInvitationId === invitation.id
																			? "Resending invitation..."
																			: "Resend invitation"
																	}
																	icon={PaperPlaneTiltIcon}
																	disabled={
																		resendingInvitationId === invitation.id
																	}
																	onClick={(event) => {
																		event.stopPropagation();
																		void handleResendInvitation(invitation);
																	}}
																/>
															)}
															<TeamIconActionButton
																label="Delete invitation"
																icon={TrashIcon}
																variant="destructive"
																onClick={(event) => {
																	event.stopPropagation();
																	openDeleteDialog(invitation);
																}}
															/>
														</div>
													)}
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
							<TablePagination
								page={page}
								pageSize={TEAM_PAGE_SIZE}
								total={totalInvitations}
								onPageChange={setPage}
							/>
						</TeamTableShell>
					)}
				</CardContent>
			</Card>

			<InviteUserDialog
				open={inviteDialogOpen}
				onOpenChange={setInviteDialogOpen}
				tenantId={tenantId}
			/>

			<TeamMemberDetailsDialog
				member={selectedMember}
				open={detailsOpen}
				onOpenChange={(open) => {
					setDetailsOpen(open);
					if (!open) {
						setSelectedMember(null);
					}
				}}
			/>

			<DeleteUserDialog
				target={
					invitationToDelete
						? {
								id: invitationToDelete.id,
								email: invitationToDelete.email,
							}
						: null
				}
				type="invitation"
				tenantId={tenantId}
				open={deleteDialogOpen}
				onOpenChange={(open) => {
					setDeleteDialogOpen(open);
					if (!open) {
						setInvitationToDelete(null);
					}
				}}
				onSuccess={handleDeleteSuccess}
			/>
		</div>
	);
}
