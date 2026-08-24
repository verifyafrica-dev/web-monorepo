import {
	BuildingsIcon,
	CalendarBlankIcon,
	ClockIcon,
	EnvelopeSimpleIcon,
	PhoneIcon,
} from "@phosphor-icons/react";
import type { AdminUser } from "#/api/http/v2/users/users.types";
import { Avatar, AvatarFallback } from "@verifyafrica/ui/components/ui/avatar";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@verifyafrica/ui/components/ui/dialog";
import { getUserInitials } from "#/lib/user.ts";
import { getTenantAvatarColor } from "../../tenants/-data";
import { formatTenantDate } from "../../tenants/-data";
import {
	formatUserLastActive,
	getUserAvatarLabel,
	getUserDisplayName,
	getUserRoleLabel,
} from "../-data";

export function UserDetailsDialog({
	open,
	user,
	onOpenChange,
}: {
	open: boolean;
	user: AdminUser | null;
	onOpenChange: (open: boolean) => void;
}) {
	if (!user) {
		return null;
	}

	const displayName = getUserDisplayName(user);
	const avatarLabel = getUserAvatarLabel(user);
	const avatarColor = getTenantAvatarColor(avatarLabel);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="font-semibold">User Details</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					<div className="flex items-center gap-4">
						<Avatar className="size-16">
							<AvatarFallback
								className={`text-lg font-semibold ${avatarColor.bg} ${avatarColor.text}`}
							>
								{getUserInitials(avatarLabel)}
							</AvatarFallback>
						</Avatar>
						<div className="space-y-2">
							{displayName ? (
								<p className="text-lg font-semibold capitalize">{displayName}</p>
							) : null}
							<div className="flex flex-wrap gap-2">
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
								{user.is_superuser ? (
									<Badge
										variant="outline"
										className="border-blue-200 bg-blue-50 text-blue-700"
									>
										Superuser
									</Badge>
								) : null}
							</div>
						</div>
					</div>

					<div className="space-y-3">
						<DetailRow icon={EnvelopeSimpleIcon} value={user.email} />
						{user.phone_number ? (
							<DetailRow icon={PhoneIcon} value={user.phone_number} />
						) : null}
						<DetailRow
							icon={CalendarBlankIcon}
							value={`Joined: ${formatTenantDate(user.created_at)}`}
						/>
						<DetailRow
							icon={ClockIcon}
							value={`Last Active: ${formatUserLastActive(user.last_login)}`}
						/>
						<DetailRow icon={BuildingsIcon} value={`Role: ${getUserRoleLabel(user)}`} />
					</div>

					{user.tenants.length > 0 ? (
						<div className="space-y-3">
							<p className="text-sm font-semibold">Tenants</p>
							<div className="divide-y rounded-lg border">
								{user.tenants.map((tenant) => (
									<div key={tenant.id} className="space-y-1 px-4 py-3">
										<p className="text-sm font-medium capitalize">{tenant.name}</p>
										<p className="text-xs text-muted-foreground capitalize">
											Role: {tenant.role}
										</p>
									</div>
								))}
							</div>
						</div>
					) : null}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function DetailRow({
	icon: Icon,
	value,
}: {
	icon: typeof EnvelopeSimpleIcon;
	value: string;
}) {
	return (
		<div className="flex items-center gap-3 text-sm text-muted-foreground">
			<Icon className="size-4 shrink-0" />
			<span>{value}</span>
		</div>
	);
}
