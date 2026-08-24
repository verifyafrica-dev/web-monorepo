import { cn } from "#/lib/utils.ts";
import { ROLE_LABELS, type TenantUserRole } from "../-data";

export function getRoleBadgeClassName(role: TenantUserRole) {
	const baseClasses = "inline-flex rounded px-2 py-1 text-xs font-medium";

	switch (role) {
		case "admin":
			return cn(baseClasses, "bg-purple-100 text-purple-800");
		case "member":
			return cn(baseClasses, "bg-blue-100 text-blue-800");
		default:
			return cn(baseClasses, "bg-gray-100 text-gray-800");
	}
}

export function UserRoleBadge({ role }: { role: TenantUserRole }) {
	return (
		<span className={getRoleBadgeClassName(role)}>{ROLE_LABELS[role]}</span>
	);
}
