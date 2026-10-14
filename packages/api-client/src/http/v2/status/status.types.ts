export type ComponentStatus =
	| "operational"
	| "degraded"
	| "partial_outage"
	| "major_outage"
	| "maintenance";

export type IncidentStatus =
	| "investigating"
	| "identified"
	| "monitoring"
	| "resolved";

export type StatusComponentGroupKey =
	| "platform"
	| "products"
	| "government_registry";

export interface StatusHistoryDay {
	date: string;
	/** Percentage 0–100, or null when no checks were recorded that day. */
	uptime: number | null;
	status: ComponentStatus | null;
}

export interface StatusComponent {
	key: string;
	name: string;
	group: StatusComponentGroupKey;
	description: string;
	status: ComponentStatus;
	uptime_percentage: number | null;
	history: StatusHistoryDay[];
}

export interface StatusIncidentUpdate {
	status: IncidentStatus;
	message: string;
	created_at: string;
}

export interface StatusIncident {
	id: string;
	title: string;
	status: IncidentStatus;
	impact: ComponentStatus;
	components: string[];
	started_at: string;
	resolved_at: string | null;
	updates: StatusIncidentUpdate[];
}

export interface StatusSummary {
	status: ComponentStatus;
	updated_at: string;
	last_checked_at: string | null;
	is_stale: boolean;
	groups: { key: StatusComponentGroupKey; name: string }[];
	components: StatusComponent[];
	active_incidents: StatusIncident[];
	recent_incidents: StatusIncident[];
}
