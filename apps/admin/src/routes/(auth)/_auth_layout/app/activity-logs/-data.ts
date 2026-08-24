import type { ActivityLog } from "#/api/http/v2/activity-logs/activity-logs.types";
import { formatTenantDate } from "../tenants/-data";
import { downloadCsv } from "../tenants/$tenantId/-data";

export function matchesActivityLogSearch(
	log: Pick<
		ActivityLog,
		"action" | "description" | "user_name" | "ip_address" | "tenant_name"
	>,
	query: string,
) {
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) {
		return true;
	}

	return [
		log.action,
		log.description,
		log.user_name,
		log.ip_address,
		log.tenant_name,
	]
		.filter(Boolean)
		.some((value) => String(value).toLowerCase().includes(normalizedQuery));
}

export function formatActionLabel(action: string) {
	return action.replaceAll(".", " · ").replaceAll("_", " ");
}

export function getActionBadgeClass(action: string) {
	const normalizedAction = action.toLowerCase();

	if (
		normalizedAction.includes("create") ||
		normalizedAction.includes("approve")
	) {
		return "border-emerald-200 bg-emerald-50 text-emerald-700";
	}

	if (
		normalizedAction.includes("disable") ||
		normalizedAction.includes("reject") ||
		normalizedAction.includes("delete")
	) {
		return "border-red-200 bg-red-50 text-red-700";
	}

	if (
		normalizedAction.includes("update") ||
		normalizedAction.includes("modify") ||
		normalizedAction.includes("edit")
	) {
		return "border-blue-200 bg-blue-50 text-blue-700";
	}

	return "border-muted bg-muted text-muted-foreground";
}

export function exportActivityLogsCsv(
	logs: ActivityLog[],
	filenamePrefix = "activity_logs",
) {
	downloadCsv(
		`${filenamePrefix}_${new Date().toISOString().split("T")[0]}.csv`,
		[
			[
				"Timestamp",
				"Action",
				"User",
				"Tenant",
				"Description",
				"IP Address",
				"User Agent",
			],
			...logs.map((log) => [
				formatTenantDate(log.created_at),
				log.action,
				log.user_name ?? "Unknown User",
				log.tenant_name ?? "N/A",
				log.description ?? "",
				log.ip_address ?? "N/A",
				log.user_agent ?? "N/A",
			]),
		],
	);
}
