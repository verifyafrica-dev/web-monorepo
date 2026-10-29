/**
 * Canonical VerifyAfrica app origins across deploy environments.
 *
 * - `local` — portless dev (`*.verifyafrica.localhost`)
 * - `dev` — rigorous development (`dev.*.verifyafrica.io`, deploys from `dev`)
 * - `test` — staging (`test.*.verifyafrica.io`, deploys from `staging`)
 * - `production` — live (`*.verifyafrica.io`, deploys from `main`)
 *
 * Backend mirrors these in `backend-main/src/core/domain_constants.py`.
 */

export type DeployEnvironment = "local" | "dev" | "test" | "production";

/** In-app Live ↔ Test API mode (customer-facing switcher). */
export type ApiMode = "live" | "test";

export type AppSurface = "client" | "admin" | "app" | "status" | "api";

export type ApiModeConfig = {
	liveApiBaseUrl: string;
	testApiBaseUrl: string;
	switcherEnabled: boolean;
	defaultMode: ApiMode;
};

export const DEPLOY_ENVIRONMENTS = ["local", "dev", "test", "production"] as const;

/** Portless dev hostnames (no scheme). */
export const PORTLESS_HOSTS = {
	client: "client.verifyafrica.localhost",
	admin: "admin.verifyafrica.localhost",
	app: "app.verifyafrica.localhost",
	status: "status.verifyafrica.localhost",
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
		status: `https://${PORTLESS_HOSTS.status}`,
		api: `http://localhost:${DEV_API_PORT}`,
	},
	dev: {
		client: "https://dev.dashboard.verifyafrica.io",
		admin: "https://dev.admin.verifyafrica.io",
		app: "https://dev.app.verifyafrica.io",
		status: "https://dev.status.verifyafrica.io",
		// Shared development API until a dedicated `dev.api` is provisioned.
		api: "https://test.api.verifyafrica.io",
	},
	test: {
		client: "https://test.dashboard.verifyafrica.io",
		admin: "https://test.admin.verifyafrica.io",
		app: "https://test.app.verifyafrica.io",
		status: "https://test.status.verifyafrica.io",
		api: "https://test.api.verifyafrica.io",
	},
	production: {
		client: "https://dashboard.verifyafrica.io",
		admin: "https://admin.verifyafrica.io",
		app: "https://app.verifyafrica.io",
		status: "https://status.verifyafrica.io",
		api: "https://api.verifyafrica.io",
	},
};

/** Legacy docker-compose localhost ports (backend defaults without portless). */
export const LEGACY_LOCAL_ORIGINS: Record<AppSurface, string> = {
	client: "http://localhost:3000",
	admin: "http://localhost:3005",
	app: "http://localhost:8010",
	status: "http://localhost:8040",
	api: "http://localhost:8000",
};

export const API_BASE_URLS = {
	dev: `${APP_ORIGINS.dev.api}/api`,
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

/**
 * Resolve Live/Test API bases for the current frontend deploy.
 * Internal `dev.*` / `test.*` frontends stay development-only (no customer switcher).
 */
export function resolveApiModeConfig(
	configuredApiBaseUrl: string,
	deployEnvironment: DeployEnvironment,
): ApiModeConfig {
	if (deployEnvironment === "dev" || deployEnvironment === "test") {
		const apiBaseUrl =
			deployEnvironment === "dev" ? API_BASE_URLS.dev : API_BASE_URLS.test;
		return {
			liveApiBaseUrl: apiBaseUrl,
			testApiBaseUrl: apiBaseUrl,
			switcherEnabled: false,
			defaultMode: "test",
		};
	}

	if (deployEnvironment === "production") {
		return {
			liveApiBaseUrl: API_BASE_URLS.production,
			testApiBaseUrl: API_BASE_URLS.test,
			switcherEnabled: true,
			defaultMode: "live",
		};
	}

	// Local: fixed to the configured API — no Live↔Test switcher.
	return {
		liveApiBaseUrl: configuredApiBaseUrl,
		testApiBaseUrl: configuredApiBaseUrl,
		switcherEnabled: false,
		defaultMode: "live",
	};
}

export function getApiBaseUrlForMode(
	mode: ApiMode,
	config: ApiModeConfig,
): string {
	return mode === "test" ? config.testApiBaseUrl : config.liveApiBaseUrl;
}

export function getVerifyAppOriginForMode(
	mode: ApiMode,
	host?: string,
): string {
	if (mode === "test") {
		return APP_ORIGINS.test.app;
	}

	const resolvedHost =
		host ?? (typeof window !== "undefined" ? window.location.host : "");
	const deployEnv = detectDeployEnvironment(resolvedHost);
	if (deployEnv === "local") {
		return APP_ORIGINS.local.app;
	}
	if (deployEnv === "dev") {
		return APP_ORIGINS.dev.app;
	}
	return APP_ORIGINS.production.app;
}

export function withApiModeQueryKey<T extends readonly unknown[]>(
	mode: ApiMode,
	queryKey: T,
): [ApiMode, ...T] {
	return [mode, ...queryKey];
}

export function detectDeployEnvironment(host: string): DeployEnvironment {
	const normalized = host.toLowerCase();

	// Check prefixed hosts before bare production hosts (`dev.dashboard` also
	// contains `dashboard.verifyafrica.io`).
	if (
		normalized.includes("test.dashboard.verifyafrica.io") ||
		normalized.includes("test.admin.verifyafrica.io") ||
		normalized.includes("test.app.verifyafrica.io") ||
		normalized.includes("test.status.verifyafrica.io") ||
		normalized.includes("test.api.verifyafrica.io")
	) {
		return "test";
	}

	if (
		normalized.includes("dev.dashboard.verifyafrica.io") ||
		normalized.includes("dev.admin.verifyafrica.io") ||
		normalized.includes("dev.app.verifyafrica.io") ||
		normalized.includes("dev.status.verifyafrica.io") ||
		normalized.includes("dev.api.verifyafrica.io")
	) {
		return "dev";
	}

	if (
		normalized.includes("dashboard.verifyafrica.io") ||
		normalized.includes("admin.verifyafrica.io") ||
		normalized.includes("app.verifyafrica.io") ||
		normalized.includes("status.verifyafrica.io") ||
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
		if (deployEnv === "dev") return "dev-dashboard:";
		if (deployEnv === "test") return "test-dashboard:";
		return "dashboard:";
	}

	if (normalized.includes("admin.verifyafrica.io")) {
		if (deployEnv === "dev") return "dev-admin:";
		if (deployEnv === "test") return "test-admin:";
		return "admin:";
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

export function buildNewVerifyUrl(
	linkToken: string,
	host?: string,
	mode?: ApiMode,
): string {
	const origin = mode
		? getVerifyAppOriginForMode(mode, host)
		: getVerifyAppOrigin(host);
	return joinOrigin(origin, `/new-verify/${linkToken}`);
}

export function buildHostedVerificationUrl(
	linkToken: string,
	host?: string,
	mode?: ApiMode,
): string {
	if (mode === "test") {
		return joinOrigin(APP_ORIGINS.test.client, `/verify/${linkToken}`);
	}
	return joinOrigin(getClientAppOrigin(host), `/verify/${linkToken}`);
}
