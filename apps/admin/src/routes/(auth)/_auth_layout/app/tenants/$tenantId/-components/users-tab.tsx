import {
	DotsThreeVerticalIcon,
	MagnifyingGlassIcon,
	UsersIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getV2ErrorMessage } from "#/api/http/shared";
import {
	useRemoveTenantUserV2Mutation,
	useTenantUsersV2Query,
	useUpdateTenantUserMembershipV2Mutation,
} from "#/api/http/v2/tenants/tenants.hooks";
import type { TenantUser } from "#/api/http/v2/tenants/tenants.types";
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
import { Avatar, AvatarFallback } from "@verifyafrica/ui/components/ui/avatar";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@verifyafrica/ui/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@verifyafrica/ui/components/ui/dropdown-menu";
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
import { getUserInitials } from "#/lib/user.ts";
import { cn } from "@verifyafrica/ui/lib/utils";
import { getTenantAvatarColor } from "../../-data";
import { formatTenantDate } from "../-data";

const PAGE_SIZE = 10;
const USERS_FETCH_SIZE = 100;
const USER_TABLE_COLUMNS = [
	"User",
	"Email",
	"Role",
	"Joined",
	"Status",
	"Actions",
] as const;

function getUserTableHeadClassName(index: number, total: number) {
	if (index === 0) {
		return "min-w-[220px] pl-4 text-xs font-semibold tracking-wide uppercase sm:pl-6";
	}

	if (index === total - 1) {
		return "pr-4 text-right text-xs font-semibold tracking-wide uppercase sm:pr-6";
	}

	if (index === 1) {
		return "min-w-[220px] text-xs font-semibold tracking-wide uppercase";
	}

	if (index === 3) {
		return "min-w-[180px] text-xs font-semibold tracking-wide uppercase";
	}

	return "text-xs font-semibold tracking-wide uppercase";
}

function getUserDisplayName(user: TenantUser) {
	const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
	return fullName || user.email;
}

function matchesUserSearch(user: TenantUser, query: string) {
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) {
		return true;
	}

	return [
		user.email,
		user.first_name,
		user.last_name,
		user.phone_number,
		user.role,
	]
		.filter(Boolean)
		.some((value) => value.toLowerCase().includes(normalizedQuery));
}

export function UsersTab({
	tenantId,
	onInviteUser,
}: {
	tenantId: string;
	onInviteUser: () => void;
}) {
	const [page, setPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [userToRemove, setUserToRemove] = useState<TenantUser | null>(null);
	const debouncedSearch = useDebouncedValue(searchQuery, 300);

	const usersQuery = useTenantUsersV2Query(tenantId, {
		page: 1,
		per_page: USERS_FETCH_SIZE,
	});
	const updateMembershipMutation =
		useUpdateTenantUserMembershipV2Mutation(tenantId);
	const removeUserMutation = useRemoveTenantUserV2Mutation(tenantId);

	useEffect(() => {
		setPage(1);
	}, []);

	const filteredUsers = useMemo(() => {
		return (usersQuery.data?.items ?? []).filter((user) =>
			matchesUserSearch(user, debouncedSearch),
		);
	}, [debouncedSearch, usersQuery.data?.items]);

	const { items: paginatedUsers, total, safePage } = useMemo(
		() => paginateItems(filteredUsers, page, PAGE_SIZE),
		[filteredUsers, page],
	);

	const isLoading =
		usersQuery.isPending || (usersQuery.isFetching && !usersQuery.data);
	const isMutating =
		updateMembershipMutation.isPending || removeUserMutation.isPending;
	const hasActiveSearch = debouncedSearch.trim().length > 0;

	const handleMembershipToggle = async (user: TenantUser) => {
		try {
			await updateMembershipMutation.mutateAsync({
				userId: user.id,
				membership_active: !user.membership_active,
			});
			toast.success(
				user.membership_active
					? `${getUserDisplayName(user)} deactivated`
					: `${getUserDisplayName(user)} activated`,
			);
		} catch (error) {
			toast.error(getV2ErrorMessage(error));
		}
	};

	const handleRemoveUser = async () => {
		if (!userToRemove) {
			return;
		}

		try {
			await removeUserMutation.mutateAsync(userToRemove.id);
			toast.success(`${getUserDisplayName(userToRemove)} removed from tenant`);
			setUserToRemove(null);
		} catch (error) {
			toast.error(getV2ErrorMessage(error));
		}
	};

	return (
		<>
			<Card>
				<CardHeader className="gap-4 border-b">
					<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
						<CardTitle className="font-semibold">Tenant Users</CardTitle>
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
							<div className="relative w-full sm:w-72">
								<MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									value={searchQuery}
									onChange={(event) => setSearchQuery(event.target.value)}
									placeholder="Search users..."
									className="pl-9"
									disabled={isLoading || isMutating}
								/>
							</div>
							<Button size="sm" onClick={onInviteUser} disabled={isMutating}>
								Invite User
							</Button>
						</div>
					</div>
				</CardHeader>

				<CardContent className="gap-0 p-0">
					{isLoading ? (
						<div className="p-4">
							<UsersTableSkeleton />
							<TablePaginationSkeleton />
						</div>
					) : filteredUsers.length === 0 ? (
						<div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
							<UsersIcon className="size-10 text-muted-foreground" />
							<p className="text-sm text-muted-foreground">
								{hasActiveSearch
									? "No users match your search"
									: "No users found for this tenant"}
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
										{paginatedUsers.map((user) => {
											const displayName = getUserDisplayName(user);
											const avatarColor = getTenantAvatarColor(displayName);

											return (
												<TableRow key={user.id}>
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
																	{getUserInitials(displayName).slice(0, 1)}
																</AvatarFallback>
															</Avatar>
															<p className="font-medium">{displayName}</p>
														</div>
													</TableCell>
													<TableCell className="text-muted-foreground">
														{user.email}
													</TableCell>
													<TableCell>
														<Badge
															variant="outline"
															className="border-blue-200 bg-blue-50 capitalize text-blue-700"
														>
															{user.role}
														</Badge>
													</TableCell>
													<TableCell>
														{formatTenantDate(user.joined_at)}
													</TableCell>
													<TableCell>
														<Badge
															variant="outline"
															className={
																user.membership_active
																	? "border-emerald-200 bg-emerald-50 text-emerald-700"
																	: "border-amber-200 bg-amber-50 text-amber-700"
															}
														>
															{user.membership_active ? "Active" : "Inactive"}
														</Badge>
													</TableCell>
													<TableCell className="pr-4 text-right sm:pr-6">
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<Button
																	variant="ghost"
																	size="icon-sm"
																	disabled={isMutating}
																>
																	<DotsThreeVerticalIcon className="size-4" />
																	<span className="sr-only">Open actions</span>
																</Button>
															</DropdownMenuTrigger>
															<DropdownMenuContent align="end">
																<DropdownMenuItem
																	onClick={() =>
																		void handleMembershipToggle(user)
																	}
																>
																	{user.membership_active
																		? "Deactivate"
																		: "Activate"}
																</DropdownMenuItem>
																<DropdownMenuSeparator />
																<DropdownMenuItem
																	variant="destructive"
																	onClick={() => setUserToRemove(user)}
																>
																	Remove User
																</DropdownMenuItem>
															</DropdownMenuContent>
														</DropdownMenu>
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
				open={Boolean(userToRemove)}
				onOpenChange={(open) => {
					if (!open && !removeUserMutation.isPending) {
						setUserToRemove(null);
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove user from tenant?</AlertDialogTitle>
						<AlertDialogDescription>
							This removes{" "}
							<strong>{userToRemove ? getUserDisplayName(userToRemove) : ""}</strong>{" "}
							from the tenant. They will lose access until invited again.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={removeUserMutation.isPending}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={(event) => {
								event.preventDefault();
								void handleRemoveUser();
							}}
							disabled={removeUserMutation.isPending}
						>
							{removeUserMutation.isPending ? "Removing..." : "Remove User"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

function UsersTableSkeleton() {
	return (
		<div className="space-y-3">
			{createSkeletonKeys(5, "tenant-user-row").map((key) => (
				<div key={key} className="flex items-center gap-4 px-2">
					<Skeleton className="size-9 rounded-full" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-4 w-40" />
						<Skeleton className="h-3 w-56" />
					</div>
					<Skeleton className="h-6 w-16" />
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-6 w-20" />
					<Skeleton className="size-8" />
				</div>
			))}
		</div>
	);
}
