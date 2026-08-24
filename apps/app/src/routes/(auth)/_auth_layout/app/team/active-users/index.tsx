import {
	CalendarBlankIcon,
	MagnifyingGlassIcon,
	TrashIcon,
	UserCheckIcon,
	UserMinusIcon,
} from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
	useTenantUsersV2Query,
	useTenantV2DetailQuery,
} from "#/api/http/v2/tenants/tenants.hooks";
import {
	TablePagination,
	TablePaginationSkeleton,
} from "#/components/table-pagination";
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
import { useDebouncedValue } from "#/hooks/use-debounced-value";
import { cn } from "#/lib/utils.ts";
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
import {
	type TeamMembershipAction,
	TeamMembershipDialog,
} from "../-components/team-membership-dialog";
import { TeamTableShell } from "../-components/team-table-shell";
import { TeamTableSkeleton } from "../-components/team-table-skeleton";
import { UserRoleBadge } from "../-components/user-role-badge";
import {
	TEAM_PAGE_SIZE,
	type TenantUserRole,
	useCurrentTenant,
} from "../-data";
import { InviteUserDialog } from "../invitations/-components/invite-user-dialog";
import { ActiveUserStatusBadge } from "./-components/user-status-badge";
import {
	ACTIVE_USER_STATUS_LABELS,
	ACTIVE_USER_STATUSES,
	type ActiveUser,
	type ActiveUserStatus,
	formatTeamDate,
	getUserInitials,
	mapTenantUsersToActiveUsers,
	ROLE_LABELS,
	TEAM_ROLES,
} from "./-data";

const ACTIVE_USER_TABLE_COLUMNS = [
	"Customer",
	"Email",
	"Role",
	"Date",
	"Status",
	"Actions",
];

export const Route = createFileRoute(
	"/(auth)/_auth_layout/app/team/active-users/",
)({
	head: () => ({
		meta: [
			{ title: "Active Users | VerifyAfrica" },
			{ name: "description", content: "View currently active team users and recent access activity." },
		],
	}),
	component: ActiveUsersPage,
});

function ActiveUsersPage() {
	const { user, tenantId, isTenantAdmin } = useCurrentTenant();
	const tenantQuery = useTenantV2DetailQuery(tenantId, Boolean(tenantId));
	const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [userToDelete, setUserToDelete] = useState<ActiveUser | null>(null);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<ActiveUserStatus | "all">(
		"all",
	);
	const [roleFilter, setRoleFilter] = useState<TenantUserRole | "all">("all");
	const [page, setPage] = useState(1);
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [selectedMember, setSelectedMember] =
		useState<TeamMemberDetails | null>(null);
	const [membershipDialogOpen, setMembershipDialogOpen] = useState(false);
	const [membershipAction, setMembershipAction] =
		useState<TeamMembershipAction | null>(null);
	const [userForMembership, setUserForMembership] = useState<ActiveUser | null>(
		null,
	);
	const debouncedSearch = useDebouncedValue(search, 300);
	const isKycVerified = tenantQuery.data?.kyc.kyc_verified ?? false;
	const isKycLoading = tenantQuery.isPending || tenantQuery.isFetching;
	const showOnboarding =
		!tenantQuery.isError &&
		!isKycLoading &&
		shouldShowDashboardOnboarding(isKycVerified);

	const userListQuery = useMemo(
		() => ({
			page,
			per_page: TEAM_PAGE_SIZE,
			...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
			...(statusFilter !== "all" ? { status: statusFilter } : {}),
			...(roleFilter !== "all" ? { role: roleFilter } : {}),
		}),
		[page, debouncedSearch, statusFilter, roleFilter],
	);

	const usersQuery = useTenantUsersV2Query(
		tenantId,
		userListQuery,
		Boolean(tenantId),
	);

	useEffect(() => {
		setPage(1);
	}, []);

	const users = useMemo(
		() => mapTenantUsersToActiveUsers(usersQuery.data?.items ?? [], user?.id),
		[usersQuery.data?.items, user?.id],
	);

	const totalUsers = usersQuery.data?.meta.pagination.total ?? 0;
	const hasActiveFilters =
		debouncedSearch.trim().length > 0 ||
		statusFilter !== "all" ||
		roleFilter !== "all";

	const isLoading =
		usersQuery.isPending || (usersQuery.isFetching && !usersQuery.data);

	function openDeleteDialog(activeUser: ActiveUser) {
		setUserToDelete(activeUser);
		setDeleteDialogOpen(true);
	}

	function openMemberDetails(activeUser: ActiveUser) {
		setSelectedMember({ type: "user", data: activeUser });
		setDetailsOpen(true);
	}

	function openMembershipDialog(
		activeUser: ActiveUser,
		action: TeamMembershipAction,
	) {
		setUserForMembership(activeUser);
		setMembershipAction(action);
		setMembershipDialogOpen(true);
	}

	function handleMembershipSuccess() {
		setUserForMembership(null);
		setMembershipAction(null);
	}

	function handleDeleteSuccess(_target: DeleteUserDialogTarget) {
		setUserToDelete(null);
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-semibold tracking-tight">
						Active Users
					</h1>
					<p className="text-sm text-muted-foreground">
						View and manage users on your team
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
						<CardTitle className="text-base font-semibold">Users</CardTitle>
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
							<div className="relative min-w-[200px] flex-1 sm:max-w-xs">
								<MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									placeholder="Search users..."
									value={search}
									onChange={(event) => {
										setSearch(event.target.value);
									}}
									className="pl-9"
									disabled={isLoading}
								/>
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<Label
									htmlFor="user-status-filter"
									className="sr-only"
								>
									Status
								</Label>
								<Select
									value={statusFilter}
									onValueChange={(value) => {
										setStatusFilter(value as ActiveUserStatus | "all");
									}}
									disabled={isLoading}
								>
									<SelectTrigger
										id="user-status-filter"
										className="w-[150px]"
									>
										<SelectValue placeholder="Status: All" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Status: All</SelectItem>
										{ACTIVE_USER_STATUSES.map((status) => (
											<SelectItem
												key={status}
												value={status}
											>
												{ACTIVE_USER_STATUS_LABELS[status]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Label
									htmlFor="user-role-filter"
									className="sr-only"
								>
									Role
								</Label>
								<Select
									value={roleFilter}
									onValueChange={(value) => {
										setRoleFilter(value as TenantUserRole | "all");
									}}
									disabled={isLoading}
								>
									<SelectTrigger
										id="user-role-filter"
										className="w-[150px]"
									>
										<SelectValue placeholder="Role: All" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Role: All</SelectItem>
										{TEAM_ROLES.map((role) => (
											<SelectItem
												key={role}
												value={role}
											>
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
					{usersQuery.isPending ? (
						<TeamTableShell>
							<TeamTableSkeleton columns={ACTIVE_USER_TABLE_COLUMNS} />
							<TablePaginationSkeleton />
						</TeamTableShell>
					) : usersQuery.isError ? (
						<div className="flex min-h-[320px] items-center justify-center px-6 text-sm text-muted-foreground">
							Failed to load users. Please try again.
						</div>
					) : (
						<TeamTableShell>
							<Table className={cn(users.length === 0 && "h-full flex-1")}>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										{ACTIVE_USER_TABLE_COLUMNS.map((column, index) => (
											<TableHead
												key={column}
												className={
													index === 0
														? "pl-4 text-xs font-semibold tracking-wide uppercase sm:pl-6"
														: index === ACTIVE_USER_TABLE_COLUMNS.length - 1
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
									{users.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={ACTIVE_USER_TABLE_COLUMNS.length}
												className="h-24 text-center text-sm text-muted-foreground"
											>
												{hasActiveFilters
													? "No users match your search or filters."
													: "No active users yet."}
											</TableCell>
										</TableRow>
									) : (
										users.map((activeUser) => (
											<TableRow
												key={activeUser.id}
												className="cursor-pointer"
												onClick={() => openMemberDetails(activeUser)}
											>
												<TableCell className="pl-4 sm:pl-6">
													<div className="flex items-center gap-3">
														<Avatar size="sm">
															<AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
																{getUserInitials(activeUser.name)}
															</AvatarFallback>
														</Avatar>
														<span className="text-sm font-medium">
															{activeUser.name}
															{activeUser.isCurrentUser && (
																<span className="font-normal text-muted-foreground">
																	{" "}
																	(You)
																</span>
															)}
														</span>
													</div>
												</TableCell>
												<TableCell className="text-sm">
													{activeUser.email}
												</TableCell>
												<TableCell>
													<UserRoleBadge role={activeUser.role} />
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-2 text-sm text-muted-foreground">
														<CalendarBlankIcon className="size-4 shrink-0" />
														{formatTeamDate(activeUser.joinedAt)}
													</div>
												</TableCell>
												<TableCell>
													<ActiveUserStatusBadge status={activeUser.status} />
												</TableCell>
												<TableCell className="pr-4 sm:pr-6">
													{isTenantAdmin && (
														<div className="flex items-center gap-1">
															{activeUser.status === "active" ? (
																<TeamIconActionButton
																	label="Deactivate user"
																	icon={UserMinusIcon}
																	variant="outline"
																	disabled={activeUser.isCurrentUser}
																	onClick={(event) => {
																		event.stopPropagation();
																		openMembershipDialog(
																			activeUser,
																			"deactivate",
																		);
																	}}
																/>
															) : (
																<TeamIconActionButton
																	label="Reactivate user"
																	icon={UserCheckIcon}
																	onClick={(event) => {
																		event.stopPropagation();
																		openMembershipDialog(activeUser, "activate");
																	}}
																/>
															)}
															<TeamIconActionButton
																label="Remove user"
																icon={TrashIcon}
																variant="destructive"
																disabled={activeUser.isCurrentUser}
																onClick={(event) => {
																	event.stopPropagation();
																	openDeleteDialog(activeUser);
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
								total={totalUsers}
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

			<TeamMembershipDialog
				user={userForMembership}
				action={membershipAction}
				tenantId={tenantId}
				open={membershipDialogOpen}
				onOpenChange={(open) => {
					setMembershipDialogOpen(open);
					if (!open) {
						setUserForMembership(null);
						setMembershipAction(null);
					}
				}}
				onSuccess={handleMembershipSuccess}
			/>

			<DeleteUserDialog
				target={
					userToDelete
						? {
								id: userToDelete.id,
								email: userToDelete.email,
								name: userToDelete.name,
							}
						: null
				}
				type="user"
				tenantId={tenantId}
				open={deleteDialogOpen}
				onOpenChange={(open) => {
					setDeleteDialogOpen(open);
					if (!open) {
						setUserToDelete(null);
					}
				}}
				onSuccess={handleDeleteSuccess}
			/>
		</div>
	);
}
