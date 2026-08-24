import {
	ArrowClockwiseIcon,
	DotsThreeVerticalIcon,
	FunnelIcon,
	MagnifyingGlassIcon,
	UsersIcon,
} from "@phosphor-icons/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { USERS_V2_API } from "#/api/http/v2/users/users.api";
import { useUsersV2ListQuery } from "#/api/http/v2/users/users.hooks";
import type {
	AdminUser,
	UserListSortBy,
} from "#/api/http/v2/users/users.types";
import {
	TablePagination,
	TablePaginationSkeleton,
} from "@verifyafrica/ui/components/ui-extended/table-pagination";
import { Avatar, AvatarFallback } from "@verifyafrica/ui/components/ui/avatar";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@verifyafrica/ui/components/ui/dropdown-menu";
import { Input } from "@verifyafrica/ui/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
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
import { getUserInitials } from "#/lib/user.ts";
import { cn } from "@verifyafrica/ui/lib/utils";
import { createSkeletonKeys } from "@verifyafrica/ui/lib/skeleton-keys";
import { useAuthStore } from "#/stores/auth-store";
import { getTenantAvatarColor } from "../tenants/-data";
import { ResetPasswordDialog } from "./-components/reset-password-dialog";
import { ToggleUserAccountDialog } from "./-components/toggle-user-account-dialog";
import { UserDetailsDialog } from "./-components/user-details-dialog";
import {
	canToggleUserAccount,
	DEFAULT_USER_ROLE_FILTER,
	DEFAULT_USER_SORT,
	DEFAULT_USER_TENANT_ROLE_FILTER,
	exportUsersCsv,
	formatTenantRoleLabel,
	formatUserLastActive,
	getUserAvatarLabel,
	getUserDisplayName,
	getUserPrimaryTenantName,
	getUserPrimaryTenantRole,
	getUserRoleLabel,
	USER_ROLE_FILTER,
	USER_ROLE_FILTER_OPTIONS,
	USER_SORT_OPTIONS,
	USER_TENANT_ROLE_FILTER_OPTIONS,
	type UserRoleFilter,
	type UserTenantRoleFilter,
} from "./-data";

const PAGE_SIZE = 10;

const USER_TABLE_COLUMNS = [
	"User",
	"Tenant",
	"Tenant Role",
	"Role",
	"Status",
	"Last Active",
	"Actions",
] as const;

export const Route = createFileRoute("/(auth)/_auth_layout/app/users/")({
	head: () => ({
		meta: [
			{ title: "Users | VerifyAfrica" },
			{
				name: "description",
				content: "Manage admin users, permissions, and account statuses.",
			},
		],
	}),
	component: UsersPage,
});

function getUserTableHeadClassName(index: number, total: number) {
	if (index === 0) {
		return "min-w-[260px] pl-4 text-xs font-semibold tracking-wide uppercase sm:pl-6";
	}

	if (index === total - 1) {
		return "pr-4 text-right text-xs font-semibold tracking-wide uppercase sm:pr-6";
	}

	return "text-xs font-semibold tracking-wide uppercase";
}

function UsersPage() {
	const navigate = useNavigate();
	const currentUserId = useAuthStore((state) => state.user?.id);

	const [page, setPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState<UserListSortBy>(DEFAULT_USER_SORT);
	const [roleFilter, setRoleFilter] = useState<UserRoleFilter>(
		DEFAULT_USER_ROLE_FILTER,
	);
	const [tenantRoleFilter, setTenantRoleFilter] =
		useState<UserTenantRoleFilter>(DEFAULT_USER_TENANT_ROLE_FILTER);
	const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
	const [toggleAccountOpen, setToggleAccountOpen] = useState(false);
	const debouncedSearch = useDebouncedValue(searchQuery, 300);

	const userListQuery = useMemo(
		() => ({
			page,
			per_page: PAGE_SIZE,
			sort_by: sortBy,
			...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
			...(roleFilter !== DEFAULT_USER_ROLE_FILTER ? { role: roleFilter } : {}),
			...(tenantRoleFilter !== DEFAULT_USER_TENANT_ROLE_FILTER
				? { tenant_role: tenantRoleFilter }
				: {}),
		}),
		[page, debouncedSearch, sortBy, roleFilter, tenantRoleFilter],
	);

	const usersQuery = useUsersV2ListQuery(userListQuery);

	useEffect(() => {
		setPage(1);
	}, []);

	const users = usersQuery.data?.items ?? [];
	const totalUsers = usersQuery.data?.meta.pagination.total ?? 0;

	const isLoading =
		usersQuery.isPending || (usersQuery.isFetching && !usersQuery.data);
	const isRefreshing = usersQuery.isFetching;
	const hasActiveSearch = debouncedSearch.trim().length > 0;
	const hasActiveFilters =
		hasActiveSearch ||
		sortBy !== DEFAULT_USER_SORT ||
		roleFilter !== DEFAULT_USER_ROLE_FILTER ||
		tenantRoleFilter !== DEFAULT_USER_TENANT_ROLE_FILTER;

	const handleRefresh = () => {
		void usersQuery.refetch();
	};

	const _handleExport = async () => {
		if (totalUsers === 0) {
			return;
		}

		try {
			const result = await USERS_V2_API.LIST({
				page: 1,
				per_page: Math.min(totalUsers, 500),
				sort_by: sortBy,
				...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
				...(roleFilter !== DEFAULT_USER_ROLE_FILTER
					? { role: roleFilter }
					: {}),
				...(tenantRoleFilter !== DEFAULT_USER_TENANT_ROLE_FILTER
					? { tenant_role: tenantRoleFilter }
					: {}),
			});
			exportUsersCsv(result.items);
		} catch {
			toast.error("Failed to export users");
		}
	};

	const openUserAction = (
		user: AdminUser,
		action: "details" | "reset" | "toggle",
	) => {
		setSelectedUser(user);

		if (action === "details") {
			setDetailsOpen(true);
		} else if (action === "reset") {
			setResetPasswordOpen(true);
		} else {
			setToggleAccountOpen(true);
		}
	};

	const handleViewActivityLog = (user: AdminUser) => {
		void navigate({
			to: "/app/activity-logs",
			search: { user: user.id },
		});
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-semibold tracking-tight">All Users</h1>
					<p className="text-sm text-muted-foreground">
						Manage all platform users across all tenants.
					</p>
				</div>
				<div className="flex flex-col gap-2 sm:flex-row">
					{/* <Button
						variant="outline"
						onClick={handleExport}
						disabled={isLoading || totalUsers === 0}
					>
						<DownloadSimpleIcon />
						Export
					</Button> */}
					<Button
						variant="outline"
						onClick={handleRefresh}
						disabled={isRefreshing}
					>
						<ArrowClockwiseIcon
							className={isRefreshing ? "animate-spin" : undefined}
							weight="bold"
						/>
						Refresh
					</Button>
				</div>
			</div>

			<Card className="gap-0 py-0">
				<div className="border-b p-4 sm:p-6">
					<div className="relative">
						<MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
							placeholder="Search by name, email, or tenant..."
							className="pl-9"
							disabled={isLoading}
						/>
					</div>
				</div>

				<div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center sm:px-6">
					<div className="flex items-center gap-2">
						<FunnelIcon className="size-4 text-muted-foreground" />
						<span className="text-sm font-medium">Filters:</span>
					</div>

					<div
						className={cn("grid flex-1 gap-3 sm:grid-cols-2 lg:max-w-2xl ", {
							"lg:grid-cols-3": roleFilter !== USER_ROLE_FILTER.SUPERUSER,
						})}
					>
						<Select
							value={roleFilter}
							onValueChange={(value) => setRoleFilter(value as UserRoleFilter)}
							disabled={isLoading}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Role" />
							</SelectTrigger>
							<SelectContent>
								{USER_ROLE_FILTER_OPTIONS.map((option) => (
									<SelectItem
										key={option.value}
										value={option.value}
									>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{roleFilter !== USER_ROLE_FILTER.SUPERUSER && (
							<Select
								value={tenantRoleFilter}
								onValueChange={(value) =>
									setTenantRoleFilter(value as UserTenantRoleFilter)
								}
								disabled={isLoading}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Tenant Role" />
								</SelectTrigger>
								<SelectContent>
									{USER_TENANT_ROLE_FILTER_OPTIONS.map((option) => (
										<SelectItem
											key={option.value}
											value={option.value}
										>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
						<Select
							value={sortBy}
							onValueChange={(value) => setSortBy(value as UserListSortBy)}
							disabled={isLoading}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Sort by" />
							</SelectTrigger>
							<SelectContent>
								{USER_SORT_OPTIONS.map((option) => (
									<SelectItem
										key={option.value}
										value={option.value}
									>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{hasActiveFilters ? (
						<Button
							variant="ghost"
							onClick={() => {
								setSearchQuery("");
								setSortBy(DEFAULT_USER_SORT);
								setRoleFilter(DEFAULT_USER_ROLE_FILTER);
								setTenantRoleFilter(DEFAULT_USER_TENANT_ROLE_FILTER);
							}}
						>
							Clear Filters
						</Button>
					) : null}
				</div>

				<CardContent className="gap-0 p-0">
					{isLoading ? (
						<div className="p-4">
							<UsersTableSkeleton />
							<TablePaginationSkeleton />
						</div>
					) : usersQuery.isError ? (
						<div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
							<p className="text-sm text-muted-foreground">
								Failed to load users. Please try again.
							</p>
							<Button onClick={handleRefresh}>Try Again</Button>
						</div>
					) : users.length === 0 ? (
						<div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
							<UsersIcon className="size-10 text-muted-foreground" />
							<p className="text-sm text-muted-foreground">
								{hasActiveFilters
									? "No users found matching your search or filters"
									: "No users available"}
							</p>
						</div>
					) : (
						<>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="hover:bg-transparent">
											{USER_TABLE_COLUMNS.map((column, index) => (
												<TableHead
													key={column}
													className={getUserTableHeadClassName(
														index,
														USER_TABLE_COLUMNS.length,
													)}
												>
													{column}
												</TableHead>
											))}
										</TableRow>
									</TableHeader>
									<TableBody>
										{users.map((user) => (
											<UserRow
												key={user.id}
												user={user}
												currentUserId={currentUserId}
												onViewDetails={() => openUserAction(user, "details")}
												onResetPassword={() => openUserAction(user, "reset")}
												onToggleAccount={() => openUserAction(user, "toggle")}
												onViewActivityLog={() => handleViewActivityLog(user)}
											/>
										))}
									</TableBody>
								</Table>
							</div>

							<TablePagination
								page={page}
								pageSize={PAGE_SIZE}
								total={totalUsers}
								onPageChange={setPage}
							/>
						</>
					)}
				</CardContent>
			</Card>

			<UserDetailsDialog
				open={detailsOpen}
				user={selectedUser}
				onOpenChange={(open) => {
					setDetailsOpen(open);
					if (!open) {
						setSelectedUser(null);
					}
				}}
			/>

			<ResetPasswordDialog
				open={resetPasswordOpen}
				user={selectedUser}
				onOpenChange={(open) => {
					setResetPasswordOpen(open);
					if (!open) {
						setSelectedUser(null);
					}
				}}
			/>

			<ToggleUserAccountDialog
				open={toggleAccountOpen}
				user={selectedUser}
				onOpenChange={(open) => {
					setToggleAccountOpen(open);
					if (!open) {
						setSelectedUser(null);
					}
				}}
				onSuccess={() => void usersQuery.refetch()}
			/>
		</div>
	);
}

function UserRow({
	user,
	currentUserId,
	onViewDetails,
	onResetPassword,
	onToggleAccount,
	onViewActivityLog,
}: {
	user: AdminUser;
	currentUserId?: string | null;
	onViewDetails: () => void;
	onResetPassword: () => void;
	onToggleAccount: () => void;
	onViewActivityLog: () => void;
}) {
	const displayName = getUserDisplayName(user);
	const avatarLabel = getUserAvatarLabel(user);
	const avatarColor = getTenantAvatarColor(avatarLabel);
	const showToggleAccount = canToggleUserAccount(user, currentUserId);
	const tenantRole = getUserPrimaryTenantRole(user);

	return (
		<TableRow>
			<TableCell className="pl-4 sm:pl-6">
				<div className="flex items-center gap-3">
					<Avatar className="size-9">
						<AvatarFallback
							className={cn(
								"text-sm font-semibold",
								avatarColor.bg,
								avatarColor.text,
							)}
						>
							{getUserInitials(avatarLabel)}
						</AvatarFallback>
					</Avatar>
					<div>
						{displayName ? (
							<p className="font-medium capitalize">{displayName}</p>
						) : null}
						<p
							className={cn(
								"text-muted-foreground",
								displayName ? "text-xs" : "text-sm",
							)}
						>
							{user.email}
						</p>
					</div>
				</div>
			</TableCell>
			<TableCell className="capitalize">
				{getUserPrimaryTenantName(user)}
			</TableCell>
			<TableCell>
				{tenantRole ? (
					<Badge
						variant="outline"
						className="border-blue-200 bg-blue-50 capitalize text-blue-700"
					>
						{formatTenantRoleLabel(tenantRole)}
					</Badge>
				) : (
					<span className="text-muted-foreground">-</span>
				)}
			</TableCell>
			<TableCell>
				<Badge
					variant="outline"
					className={
						user.is_superuser
							? "border-blue-200 bg-blue-50 text-blue-700"
							: "border-muted bg-muted text-muted-foreground"
					}
				>
					{getUserRoleLabel(user)}
				</Badge>
			</TableCell>
			<TableCell>
				<Badge
					variant="outline"
					className={
						user.is_active
							? "border-emerald-200 bg-emerald-50 text-emerald-700"
							: "border-muted bg-muted text-muted-foreground"
					}
				>
					{user.is_active ? "Active" : "Inactive"}
				</Badge>
			</TableCell>
			<TableCell>{formatUserLastActive(user.last_login)}</TableCell>
			<TableCell className="pr-4 text-right sm:pr-6">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
						>
							<DotsThreeVerticalIcon className="size-4" />
							<span className="sr-only">Open actions</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem
							onClick={onViewDetails}
							className="whitespace-nowrap"
						>
							View Details
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={onResetPassword}
							className="whitespace-nowrap"
						>
							Reset Password
						</DropdownMenuItem>
						{showToggleAccount ? (
							<DropdownMenuItem
								onClick={onToggleAccount}
								className="whitespace-nowrap"
							>
								{user.is_active ? "Disable Account" : "Enable Account"}
							</DropdownMenuItem>
						) : null}
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={onViewActivityLog}
							className="whitespace-nowrap"
						>
							View Activity Log
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</TableCell>
		</TableRow>
	);
}

function UsersTableSkeleton() {
	return (
		<div className="space-y-3">
			{createSkeletonKeys(5, "user-row").map((key) => (
				<div
					key={key}
					className="flex items-center gap-4 px-2"
				>
					<Skeleton className="size-9 rounded-full" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-4 w-40" />
						<Skeleton className="h-3 w-56" />
					</div>
					<Skeleton className="h-4 w-28" />
					<Skeleton className="h-6 w-16" />
					<Skeleton className="h-6 w-16" />
					<Skeleton className="h-6 w-20" />
					<Skeleton className="h-4 w-32" />
					<Skeleton className="size-8" />
				</div>
			))}
		</div>
	);
}
