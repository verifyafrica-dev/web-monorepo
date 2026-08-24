import type {
	InvitationStatus as ApiInvitationStatus,
	TenantInvitation,
} from "#/api/http/v2/tenants/tenants.types";
import type { TenantUserRole } from "../-data";

export type InvitationStatus = "pending" | "accepted" | "expired" | "cancelled";

export type UserInvitation = {
	id: string;
	email: string;
	name?: string;
	role: TenantUserRole;
	status: InvitationStatus;
	expiresAt: Date;
};

export {
	formatTeamDate as formatInvitationExpiry,
	ROLE_LABELS,
	TEAM_PAGE_SIZE,
	TEAM_ROLES as INVITATION_ROLES,
	type TenantUserRole,
} from "../-data";

export const STATUS_LABELS: Record<InvitationStatus, string> = {
	pending: "Pending",
	accepted: "Accepted",
	expired: "Expired",
	cancelled: "Cancelled",
};

export function mapApiInvitationStatus(
	status: ApiInvitationStatus,
): InvitationStatus {
	if (status === "canceled") {
		return "cancelled";
	}

	if (
		status === "pending" ||
		status === "accepted" ||
		status === "expired" ||
		status === "cancelled"
	) {
		return status;
	}

	return "expired";
}

export function canResendInvitation(status: InvitationStatus) {
	return status === "pending" || status === "expired";
}

export function resolveInvitationStatus(
	status: ApiInvitationStatus,
	expiresAt: Date,
	now = Date.now(),
): InvitationStatus {
	const mapped = mapApiInvitationStatus(status);
	if (mapped === "pending" && expiresAt.getTime() < now) {
		return "expired";
	}
	return mapped;
}

export function mapInvitationToUserInvitation(
	invitation: TenantInvitation,
): UserInvitation {
	const expiresAt = new Date(invitation.expires_at);

	return {
		id: invitation.id,
		email: invitation.email,
		name: invitation.name,
		role: invitation.role,
		status: resolveInvitationStatus(invitation.status, expiresAt),
		expiresAt,
	};
}

export function mapInvitationsToUserInvitations(
	invitations: TenantInvitation[],
): UserInvitation[] {
	return invitations.map(mapInvitationToUserInvitation);
}
