import type { TenantUser } from "#/api/http/v2/tenants/tenants.types";
import {
	formatTeamDate,
	getUserFullName,
	getUserInitials,
	ROLE_LABELS,
	TEAM_PAGE_SIZE,
	TEAM_ROLES,
	type TenantUserRole,
} from "../-data";

export type ActiveUserStatus = "active" | "inactive";

export type ActiveUser = {
	id: string;
	name: string;
	email: string;
	role: TenantUserRole;
	status: ActiveUserStatus;
	joinedAt: Date;
	isCurrentUser?: boolean;
	phoneNumber?: string | null;
	lastLogin?: Date | null;
	accountActive?: boolean;
};

export const ACTIVE_USER_STATUSES: ActiveUserStatus[] = ["active", "inactive"];

export const ACTIVE_USER_STATUS_LABELS: Record<ActiveUserStatus, string> = {
	active: "Active",
	inactive: "Inactive",
};

export {
	formatTeamDate,
	getUserInitials,
	ROLE_LABELS,
	TEAM_PAGE_SIZE,
	TEAM_ROLES,
};

export function getActiveUserStatusBadgeClassName(status: ActiveUserStatus) {
	const baseClasses =
		"inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize";

	switch (status) {
		case "active":
			return `${baseClasses} bg-green-100 text-green-800`;
		case "inactive":
			return `${baseClasses} bg-gray-100 text-gray-800`;
		default:
			return `${baseClasses} bg-gray-100 text-gray-800`;
	}
}

export function mapTenantUserToActiveUser(
	user: TenantUser,
	currentUserId?: string,
): ActiveUser {
	return {
		id: user.id,
		name: getUserFullName(user),
		email: user.email,
		role: user.role,
		status: user.membership_active ? "active" : "inactive",
		joinedAt: new Date(user.joined_at),
		isCurrentUser: user.id === currentUserId,
		phoneNumber: user.phone_number,
		lastLogin: user.last_login ? new Date(user.last_login) : null,
		accountActive: user.is_active,
	};
}

export function mapTenantUsersToActiveUsers(
	users: TenantUser[],
	currentUserId?: string,
): ActiveUser[] {
	return users.map((user) => mapTenantUserToActiveUser(user, currentUserId));
}
