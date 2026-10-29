import { BroadcastIcon, BuildingsIcon, UsersIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useMemo, useState } from "react";
import { z } from "zod";
import {
	usePresenceActiveTenantsQuery,
	usePresenceActiveUsersQuery,
} from "#/api/http/v2/presence/presence.hooks";
import type {
	PresenceActiveTenant,
	PresenceActiveUser,
	PresenceConnection,
} from "@verifyafrica/api-client/http/v2/presence/presence.types";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@verifyafrica/ui/components/ui/card";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@verifyafrica/ui/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@verifyafrica/ui/components/ui/tabs";
import { createSkeletonKeys } from "@verifyafrica/ui/lib/skeleton-keys";
import { formatTenantDate } from "../tenants/-data";

const activeSearchSchema = z.object({
	tab: z.enum(["users", "tenants"]).optional(),
});

export const Route = createFileRoute("/(auth)/_auth_layout/app/active/")({
	head: () => ({
		meta: [
			{ title: "Active Sessions | VerifyAfrica" },
			{
				name: "description",
				content: "Live view of active tenants and users across the platform.",
			},
		],
	}),
	validateSearch: activeSearchSchema,
	component: ActivePresencePage,
});

function displayName(user: Pick<PresenceActiveUser, "first_name" | "last_name" | "email">) {
	const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
	return name || user.email;
}

function deviceLabel(connection: PresenceConnection) {
	const parts = [
		connection.device.browser,
		connection.device.platform,
		connection.device.device_type,
	].filter(Boolean);
	return parts.join(" · ") || "Unknown device";
}

function ActivePresencePage() {
	const navigate = Route.useNavigate();
	const { tab: searchTab } = Route.useSearch();
	const tab = searchTab ?? "users";

	const usersQuery = usePresenceActiveUsersQuery();
	const tenantsQuery = usePresenceActiveTenantsQuery();
	const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
	const [expandedTenantId, setExpandedTenantId] = useState<string | null>(null);

	const users = usersQuery.data?.items ?? [];
	const tenants = tenantsQuery.data?.items ?? [];
	const totalConnections =
		tab === "tenants"
			? (tenantsQuery.data?.total_connections ?? 0)
			: (usersQuery.data?.total_connections ?? 0);

	const skeletonKeys = useMemo(() => createSkeletonKeys(6), []);

	return (
		<div className="flex flex-col gap-6 p-4 sm:p-6">
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-2">
					<BroadcastIcon className="size-6" weight="bold" />
					<h1 className="text-2xl font-semibold tracking-tight">Active</h1>
				</div>
				<p className="text-sm text-muted-foreground">
					Realtime presence for signed-in users and tenants, including device details.
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-3">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Open connections
						</CardTitle>
					</CardHeader>
					<CardContent className="text-2xl font-semibold">{totalConnections}</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Active users
						</CardTitle>
					</CardHeader>
					<CardContent className="text-2xl font-semibold">{users.length}</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Active tenants
						</CardTitle>
					</CardHeader>
					<CardContent className="text-2xl font-semibold">{tenants.length}</CardContent>
				</Card>
			</div>

			<Tabs
				value={tab}
				onValueChange={(value) => {
					navigate({
						search: (prev) => ({
							...prev,
							tab: value === "tenants" ? "tenants" : "users",
						}),
						replace: true,
					});
				}}
			>
				<TabsList>
					<TabsTrigger value="users" className="gap-2">
						<UsersIcon className="size-4" />
						Users
					</TabsTrigger>
					<TabsTrigger value="tenants" className="gap-2">
						<BuildingsIcon className="size-4" />
						Tenants
					</TabsTrigger>
				</TabsList>

				<TabsContent value="users" className="mt-4">
					<ActiveUsersTable
						isLoading={usersQuery.isLoading}
						users={users}
						expandedUserId={expandedUserId}
						onToggle={(userId) =>
							setExpandedUserId((current) => (current === userId ? null : userId))
						}
						skeletonKeys={skeletonKeys}
					/>
				</TabsContent>

				<TabsContent value="tenants" className="mt-4">
					<ActiveTenantsTable
						isLoading={tenantsQuery.isLoading}
						tenants={tenants}
						expandedTenantId={expandedTenantId}
						onToggle={(tenantId) =>
							setExpandedTenantId((current) =>
								current === tenantId ? null : tenantId,
							)
						}
						skeletonKeys={skeletonKeys}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}

function ActiveUsersTable({
	isLoading,
	users,
	expandedUserId,
	onToggle,
	skeletonKeys,
}: {
	isLoading: boolean;
	users: PresenceActiveUser[];
	expandedUserId: string | null;
	onToggle: (userId: string) => void;
	skeletonKeys: string[];
}) {
	return (
		<div className="overflow-hidden rounded-lg border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="pl-4">User</TableHead>
						<TableHead>Tenant</TableHead>
						<TableHead>Devices</TableHead>
						<TableHead>Last connected</TableHead>
						<TableHead className="pr-4">Role</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{isLoading
						? skeletonKeys.map((key) => (
								<TableRow key={key}>
									<TableCell className="pl-4">
										<Skeleton className="h-4 w-40" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-28" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-10" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-32" />
									</TableCell>
									<TableCell className="pr-4">
										<Skeleton className="h-4 w-20" />
									</TableCell>
								</TableRow>
							))
						: null}

					{!isLoading && users.length === 0 ? (
						<TableRow>
							<TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
								No active users right now.
							</TableCell>
						</TableRow>
					) : null}

					{!isLoading
						? users.map((user) => (
								<Fragment key={user.user_id}>
									<TableRow
										className="cursor-pointer"
										onClick={() => onToggle(user.user_id)}
									>
										<TableCell className="pl-4">
											<div className="font-medium">{displayName(user)}</div>
											<div className="text-xs text-muted-foreground">
												{user.email}
											</div>
										</TableCell>
										<TableCell>{user.tenant_name || "—"}</TableCell>
										<TableCell>
											<Badge variant="secondary">{user.connection_count}</Badge>
										</TableCell>
										<TableCell>
											{user.last_seen_at
												? formatTenantDate(user.last_seen_at)
												: "—"}
										</TableCell>
										<TableCell className="pr-4">
											{user.is_superuser ? (
												<Badge>Superadmin</Badge>
											) : (
												<Badge variant="outline">User</Badge>
											)}
										</TableCell>
									</TableRow>
									{expandedUserId === user.user_id
										? user.connections.map((connection) => (
												<TableRow
													key={connection.connection_id}
													className="bg-muted/30"
												>
													<TableCell className="pl-8 text-sm" colSpan={2}>
														{deviceLabel(connection)}
													</TableCell>
													<TableCell className="text-sm">
														{connection.app}
													</TableCell>
													<TableCell className="text-sm" colSpan={2}>
														{connection.device.timezone || "—"} ·{" "}
														{connection.device.screen || "—"}
													</TableCell>
												</TableRow>
											))
										: null}
								</Fragment>
							))
						: null}
				</TableBody>
			</Table>
		</div>
	);
}

function ActiveTenantsTable({
	isLoading,
	tenants,
	expandedTenantId,
	onToggle,
	skeletonKeys,
}: {
	isLoading: boolean;
	tenants: PresenceActiveTenant[];
	expandedTenantId: string | null;
	onToggle: (tenantId: string) => void;
	skeletonKeys: string[];
}) {
	return (
		<div className="overflow-hidden rounded-lg border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="pl-4">Tenant</TableHead>
						<TableHead>Active users</TableHead>
						<TableHead>Connections</TableHead>
						<TableHead className="pr-4">Last activity</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{isLoading
						? skeletonKeys.map((key) => (
								<TableRow key={key}>
									<TableCell className="pl-4">
										<Skeleton className="h-4 w-40" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-10" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-10" />
									</TableCell>
									<TableCell className="pr-4">
										<Skeleton className="h-4 w-32" />
									</TableCell>
								</TableRow>
							))
						: null}

					{!isLoading && tenants.length === 0 ? (
						<TableRow>
							<TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
								No active tenants right now.
							</TableCell>
						</TableRow>
					) : null}

					{!isLoading
						? tenants.map((tenant) => (
								<Fragment key={tenant.tenant_id}>
									<TableRow
										className="cursor-pointer"
										onClick={() => onToggle(tenant.tenant_id)}
									>
										<TableCell className="pl-4 font-medium">
											{tenant.tenant_name}
										</TableCell>
										<TableCell>
											<Badge variant="secondary">
												{tenant.active_user_count}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge variant="outline">
												{tenant.connection_count}
											</Badge>
										</TableCell>
										<TableCell className="pr-4">
											{tenant.last_seen_at
												? formatTenantDate(tenant.last_seen_at)
												: "—"}
										</TableCell>
									</TableRow>
									{expandedTenantId === tenant.tenant_id
										? tenant.connections.map((connection) => (
												<TableRow
													key={connection.connection_id}
													className="bg-muted/30"
												>
													<TableCell className="pl-8 text-sm" colSpan={2}>
														{connection.email} · {deviceLabel(connection)}
													</TableCell>
													<TableCell className="text-sm">
														{connection.app}
													</TableCell>
													<TableCell className="pr-4 text-sm">
														{connection.device.timezone || "—"}
													</TableCell>
												</TableRow>
											))
										: null}
								</Fragment>
							))
						: null}
				</TableBody>
			</Table>
		</div>
	);
}
