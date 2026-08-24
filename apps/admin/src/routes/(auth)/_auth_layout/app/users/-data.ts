import type { AdminUser, UserListSortBy } from "#/api/http/v2/users/users.types";
import { formatTenantDate } from "../tenants/-data";
import { downloadCsv } from "../tenants/$tenantId/-data";

export const USER_ROLE_FILTER = {
	ALL: "all",
	USER: "user",
	SUPERUSER: "superuser",
} as const;

export type UserRoleFilter =
	(typeof USER_ROLE_FILTER)[keyof typeof USER_ROLE_FILTER];

export const USER_ROLE_FILTER_VALUES = Object.values(USER_ROLE_FILTER);

export const DEFAULT_USER_ROLE_FILTER: UserRoleFilter = USER_ROLE_FILTER.ALL;

export const USER_ROLE_FILTER_OPTIONS = [
	{ value: USER_ROLE_FILTER.ALL, label: "All Roles" },
	{ value: USER_ROLE_FILTER.USER, label: "User" },
	{ value: USER_ROLE_FILTER.SUPERUSER, label: "Superuser" },
] as const satisfies ReadonlyArray<{
	value: UserRoleFilter;
	label: string;
}>;

export const USER_TENANT_ROLE_FILTER_OPTIONS = [
	{ value: "all", label: "All Tenant Roles" },
	{ value: "admin", label: "Admin" },
	{ value: "member", label: "Member" },
] as const;

export type UserTenantRoleFilter =
	(typeof USER_TENANT_ROLE_FILTER_OPTIONS)[number]["value"];

export const DEFAULT_USER_TENANT_ROLE_FILTER: UserTenantRoleFilter = "all";

export const USER_SORT_OPTIONS: {
	value: UserListSortBy;
	label: string;
}[] = [
	{ value: "recently_created", label: "Recently Created" },
	{ value: "asc", label: "Created (Oldest First)" },
	{ value: "desc", label: "Created (Newest First)" },
	{ value: "recently_logged_in", label: "Last Active" },
];

export const DEFAULT_USER_SORT: UserListSortBy = "recently_created";

export function getUserDisplayName(
	user: Pick<AdminUser, "first_name" | "last_name" | "is_superuser">,
): string | null {

	const fullName = [user.first_name, user.last_name]
		.filter(Boolean)
		.join(" ")
		.trim();

	return fullName || null;
}

export function getUserAvatarLabel(
	user: Pick<AdminUser, "first_name" | "last_name" | "email" | "is_superuser">,
) {
	return getUserDisplayName(user) ?? user.email;
}

export function getUserPrimaryTenantName(user: AdminUser) {
	return user.tenants[0]?.name ?? "N/A";
}

export function getUserPrimaryTenantRole(user: AdminUser) {
	if (user.is_superuser) {
		return null;
	}

	return user.tenants[0]?.role ?? null;
}

export function formatTenantRoleLabel(role: string) {
	return role.charAt(0).toUpperCase() + role.slice(1);
}

export function formatUserLastActive(lastLogin: string | null) {
	if (!lastLogin) {
		return "Never";
	}

	return formatTenantDate(lastLogin);
}

export function getUserRoleLabel(user: AdminUser) {
	return user.is_superuser ? "Superuser" : "User";
}

export function matchesUserSearch(user: AdminUser, query: string) {
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) {
		return true;
	}

	return [
		user.first_name,
		user.last_name,
		getUserDisplayName(user),
		user.email,
		getUserPrimaryTenantName(user),
	]
		.filter(Boolean)
		.some((value) => String(value).toLowerCase().includes(normalizedQuery));
}

export function canToggleUserAccount(
	user: AdminUser,
	currentUserId?: string | null,
) {
	if (user.id === currentUserId) {
		return false;
	}

	if (user.is_superuser) {
		return false;
	}

	return true;
}

export function exportUsersCsv(users: AdminUser[]) {
	downloadCsv(`users_export_${new Date().toISOString().split("T")[0]}.csv`, [
		[
			"First Name",
			"Last Name",
			"Email",
			"Tenant",
			"Tenant Role",
			"Role",
			"Status",
			"Last Active",
		],
		...users.map((user) => {
			const tenantRole = getUserPrimaryTenantRole(user);

			return [
				user.first_name ?? "",
				user.last_name ?? "",
				user.email,
				getUserPrimaryTenantName(user),
				tenantRole ? formatTenantRoleLabel(tenantRole) : "",
				getUserRoleLabel(user),
				user.is_active ? "Active" : "Inactive",
				formatUserLastActive(user.last_login),
			];
		}),
	]);
}
