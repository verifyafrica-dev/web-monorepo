import { UserIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import { Avatar, AvatarFallback } from "@verifyafrica/ui/components/ui/avatar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@verifyafrica/ui/components/ui/dialog";
import { formatTeamDate, getUserInitials } from "../-data";
import { ActiveUserStatusBadge } from "../active-users/-components/user-status-badge";
import type { ActiveUser } from "../active-users/-data";
import { InvitationStatusBadge } from "../invitations/-components/invitation-badges";
import type { UserInvitation } from "../invitations/-data";
import { UserRoleBadge } from "./user-role-badge";

export type TeamMemberDetails =
	| { type: "user"; data: ActiveUser }
	| { type: "invitation"; data: UserInvitation };

type TeamMemberDetailsDialogProps = {
	member: TeamMemberDetails | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div className="grid gap-1 border-b border-border/60 py-3 last:border-b-0 sm:grid-cols-[140px_1fr] sm:gap-4">
			<dt className="text-sm text-muted-foreground">{label}</dt>
			<dd className="text-sm font-medium">{value}</dd>
		</div>
	);
}

function formatOptionalDate(date: Date | null | undefined) {
	if (!date) {
		return "—";
	}

	return formatTeamDate(date);
}

export function TeamMemberDetailsDialog({
	member,
	open,
	onOpenChange,
}: TeamMemberDetailsDialogProps) {
	if (!member) {
		return null;
	}

	const isUser = member.type === "user";
	const user = isUser ? member.data : null;
	const invitation = !isUser ? member.data : null;

	const displayName = isUser
		? user?.name
		: invitation?.name?.trim() || invitation?.email;

	const subtitle = isUser
		? user?.isCurrentUser
			? "Active team member (You)"
			: "Active team member"
		: "Pending invitation";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<div className="flex items-center gap-4">
						<Avatar size="lg">
							<AvatarFallback
								className={
									isUser
										? "bg-primary/10 text-sm font-semibold text-primary"
										: undefined
								}
							>
								{isUser ? (
									getUserInitials(user?.name)
								) : (
									<UserIcon className="size-5" />
								)}
							</AvatarFallback>
						</Avatar>
						<div className="min-w-0 flex-1">
							<DialogTitle className="truncate">{displayName}</DialogTitle>
							<DialogDescription>{subtitle}</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<dl className="mt-2">
					{isUser ? (
						<>
							<DetailRow label="Email" value={user?.email} />
							<DetailRow
								label="Role"
								value={<UserRoleBadge role={user?.role} />}
							/>
							<DetailRow
								label="Membership"
								value={<ActiveUserStatusBadge status={user?.status} />}
							/>
							<DetailRow
								label="Joined"
								value={formatTeamDate(user?.joinedAt)}
							/>
							<DetailRow
								label="Phone"
								value={user?.phoneNumber?.trim() || "—"}
							/>
							<DetailRow
								label="Last login"
								value={formatOptionalDate(user?.lastLogin)}
							/>
							<DetailRow
								label="Account status"
								value={user?.accountActive ? "Active" : "Inactive"}
							/>
						</>
					) : (
						<>
							<DetailRow label="Email" value={invitation?.email} />
							{invitation?.name?.trim() ? (
								<DetailRow label="Name" value={invitation?.name} />
							) : null}
							<DetailRow
								label="Role"
								value={<UserRoleBadge role={invitation?.role} />}
							/>
							<DetailRow
								label="Invitation status"
								value={<InvitationStatusBadge status={invitation?.status} />}
							/>
							<DetailRow
								label="Expires"
								value={formatTeamDate(invitation?.expiresAt)}
							/>
						</>
					)}
				</dl>
			</DialogContent>
		</Dialog>
	);
}
