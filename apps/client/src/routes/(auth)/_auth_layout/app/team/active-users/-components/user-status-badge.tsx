import {
	ACTIVE_USER_STATUS_LABELS,
	type ActiveUserStatus,
	getActiveUserStatusBadgeClassName,
} from "../-data";

export function ActiveUserStatusBadge({
	status,
}: {
	status: ActiveUserStatus;
}) {
	return (
		<span className={getActiveUserStatusBadgeClassName(status)}>
			{ACTIVE_USER_STATUS_LABELS[status]}
		</span>
	);
}
