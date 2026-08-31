/**
 * Canonical VerifyAfrica app origins across deploy environments.
 *
 * - `local` — portless dev (`*.verifyafrica.localhost`)
 * - `test` — Railway / staging (`test.*.verifyafrica.io`)
 * - `production` — live (`*.verifyafrica.io`)
 *
 * Backend mirrors these in `backend-main/src/core/domain_constants.py`.
 */

export type DeployEnvironment = "local" | "test" | "production";

export type AppSurface = "client" | "admin" | "app" | "api";

export const DEPLOY_ENVIRONMENTS = ["local", "test", "production"] as const;

/** Portless dev hostnames (no scheme). */
export const PORTLESS_HOSTS = {
	client: "client.verifyafrica.localhost",
	admin: "admin.verifyafrica.localhost",
	app: "app.verifyafrica.localhost",
} as const;

/** Docker Compose API port exposed to frontends in local dev. */
export const DEV_API_PORT = 8300;

/** Canonical hosted origins per environment (includes scheme, no trailing slash). */
export const APP_ORIGINS: Record<
	DeployEnvironment,
	Record<AppSurface, string>
> = {
	local: {
		client: `https://${PORTLESS_HOSTS.client}`,
		admin: `https://${PORTLESS_HOSTS.admin}`,
		app: `https://${PORTLESS_HOSTS.app}`,
		api: `http://localhost:${DEV_API_PORT}`,
	},
	test: {
		client: "https://test.dashboard.verifyafrica.io",
		admin: "https://test.admin.verifyafrica.io",
		app: "https://test.app.verifyafrica.io",
		api: "https://test.api.verifyafrica.io",
	},
	production: {
		client: "https://dashboard.verifyafrica.io",
		admin: "https://admin.verifyafrica.io",
		app: "https://app.verifyafrica.io",
		api: "https://api.verifyafrica.io",
	},
};

/** Legacy docker-compose localhost ports (backend defaults without portless). */
export const LEGACY_LOCAL_ORIGINS: Record<AppSurface, string> = {
	client: "http://localhost:3000",
	admin: "http://localhost:3005",
	app: "http://localhost:8010",
	api: "http://localhost:8000",
};

export const API_BASE_URLS = {
	test: `${APP_ORIGINS.test.api}/api`,
	production: `${APP_ORIGINS.production.api}/api`,
} as const;

export function getAppOrigin(
	deployEnv: DeployEnvironment,
	surface: AppSurface,
): string {
	return APP_ORIGINS[deployEnv][surface];
}

export function getLocalApiBaseUrl(): string {
	return `${APP_ORIGINS.local.api}/api`;
}

export function getApiBaseUrlForEnvironment(
	deployEnv: DeployEnvironment,
): string {
	if (deployEnv === "local") {
		return getLocalApiBaseUrl();
	}
	return API_BASE_URLS[deployEnv];
}

export function detectDeployEnvironment(host: string): DeployEnvironment {
	const normalized = host.toLowerCase();

	if (
		normalized.includes("test.dashboard.verifyafrica.io") ||
		normalized.includes("test.admin.verifyafrica.io") ||
		normalized.includes("test.app.verifyafrica.io") ||
		normalized.includes("test.api.verifyafrica.io")
	) {
		return "test";
	}

	if (
		normalized.includes("dashboard.verifyafrica.io") ||
		normalized.includes("admin.verifyafrica.io") ||
		normalized.includes("app.verifyafrica.io") ||
		normalized.includes("api.verifyafrica.io")
	) {
		return "production";
	}

	return "local";
}

/** Prefix for access-token cookies scoped by host. */
export function getAuthTokenPrefix(host: string): string {
	const deployEnv = detectDeployEnvironment(host);
	const normalized = host.toLowerCase();

	if (deployEnv === "local") {
		return "local:";
	}

	if (normalized.includes("dashboard.verifyafrica.io")) {
		return deployEnv === "test" ? "test-dashboard:" : "dashboard:";
	}

	if (normalized.includes("admin.verifyafrica.io")) {
		return deployEnv === "test" ? "test-admin:" : "admin:";
	}

	return "local:";
}

export function joinOrigin(origin: string, path: string): string {
	const base = origin.replace(/\/+$/, "");
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	return `${base}${normalizedPath}`;
}

export function getClientAppOrigin(host?: string): string {
	const resolvedHost =
		host ?? (typeof window !== "undefined" ? window.location.host : "");
	return getAppOrigin(detectDeployEnvironment(resolvedHost), "client");
}

export function getVerifyAppOrigin(host?: string): string {
	const resolvedHost =
		host ?? (typeof window !== "undefined" ? window.location.host : "");
	return getAppOrigin(detectDeployEnvironment(resolvedHost), "app");
}

export function buildNewVerifyUrl(linkToken: string, host?: string): string {
	return joinOrigin(getVerifyAppOrigin(host), `/new-verify/${linkToken}`);
}

export function buildHostedVerificationUrl(
	linkToken: string,
	host?: string,
): string {
	return joinOrigin(getClientAppOrigin(host), `/verify/${linkToken}`);
}
