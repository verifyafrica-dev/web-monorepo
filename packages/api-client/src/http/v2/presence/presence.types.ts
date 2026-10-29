export type PresenceApp = "dashboard" | "admin" | "verify";

export type PresenceDeviceInfo = {
	user_agent: string;
	platform: string;
	browser: string;
	device_type: string;
	screen: string;
	timezone: string;
	language: string;
};

export type PresenceConnection = {
	connection_id: string;
	user_id: string;
	email: string;
	first_name: string;
	last_name: string;
	is_superuser: boolean;
	tenant_id: string | null;
	tenant_name: string | null;
	app: string;
	device: PresenceDeviceInfo;
	connected_at: string;
};

export type PresenceActiveUser = {
	user_id: string;
	email: string;
	first_name: string;
	last_name: string;
	is_superuser: boolean;
	tenant_id: string | null;
	tenant_name: string | null;
	connection_count: number;
	connections: PresenceConnection[];
	last_seen_at: string | null;
};

export type PresenceActiveTenant = {
	tenant_id: string;
	tenant_name: string;
	active_user_count: number;
	connection_count: number;
	connections: PresenceConnection[];
	last_seen_at: string | null;
};

export type PresenceConfig = {
	key: string;
	cluster: string;
	presence_channel: string;
	admin_channel: string | null;
};

export type PresenceActiveSnapshot<T> = {
	tab: "users" | "tenants";
	total_connections: number;
	items: T[];
};

export type PresenceUpdatedEvent = {
	type: "connection.online" | "connection.offline";
	connection: PresenceConnection;
	emitted_at: string;
};
