import { detectDeployEnvironment } from "@verifyafrica/config/domains";
import { z } from "zod";

const optionalUrl = z.preprocess(
	(value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
	z.string().url().optional(),
);

const envSchema = z.object({
	VITE_API_BASE_URL: z.url(),
	/** Production Live↔Test switcher only — ignored on local/dev/test hosts. */
	VITE_LIVE_API_BASE_URL: optionalUrl,
	VITE_TEST_API_BASE_URL: optionalUrl,
	VITE_APP_NAME: z.string().default("Verify Africa"),
	VITE_APP_ENVIRONMENT: z.string().default("development"),
	/** Mirrors backend ENV_STATE. Unused in UI yet. */
	VITE_ENV_STATE: z.enum(["production", "sandbox", "dev"]).optional().default("dev"),
	VITE_SITE_TYPE: z.enum(["public", "client", "admin", "dashboard"]).optional(),
	VITE_ENABLE_ANALYTICS: z.enum(["true", "false"]).optional().default("false"),
	VITE_ENABLE_DEBUG: z.enum(["true", "false"]).optional().default("false"),
	VITE_LANDING_PAGE_VERSION: z.enum(["v1", "v2", "v3"]).optional().default("v1"),
	VITE_GOOGLE_ANALYTICS_ID: z.string().optional(),
	VITE_SENTRY_DSN: z.string().optional(),
	VITE_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
	VITE_LOGROCKET_KEY: z.string().optional(),
	VITE_POSTHOG_KEY: z.string().optional(),
	VITE_POSTHOG_HOST: z.string().url().optional().default("https://us.i.posthog.com"),
	VITE_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
	VITE_PUBLIC_SUPABASE_URL: z.string().url().optional(),
	VITE_PUSHER_KEY: z.string().optional(),
	VITE_PUSHER_CLUSTER: z.string().optional().default("eu"),
});

const parsed = envSchema.safeParse(import.meta.env);
if (!parsed.success) {
	console.error("[env] Invalid environment configuration:");
	console.error(parsed.error.flatten().fieldErrors);
	throw new Error("Invalid environment configuration");
}

const data = parsed.data;
// Prefer Live URL for deploy detection on production builds; else the single API URL.
// Derived from env rather than window.location so SSR and hydration agree.
const detectionHost = new URL(
	data.VITE_LIVE_API_BASE_URL ?? data.VITE_API_BASE_URL,
).host;
const deployEnvironment = detectDeployEnvironment(detectionHost);

export const env = {
	...parsed.data,
	// Backward-compatible app config accessors
	apiBaseUrl: data.VITE_API_BASE_URL,
	liveApiBaseUrl: data.VITE_LIVE_API_BASE_URL,
	testApiBaseUrl: data.VITE_TEST_API_BASE_URL,
	appName: data.VITE_APP_NAME,
	appEnvironment: data.VITE_APP_ENVIRONMENT,
	envState: data.VITE_ENV_STATE,
	siteType: data.VITE_SITE_TYPE,
	enableAnalytics: data.VITE_ENABLE_ANALYTICS === "true",
	enableDebug: data.VITE_ENABLE_DEBUG === "true",
	landingPageVersion: data.VITE_LANDING_PAGE_VERSION,
	googleAnalyticsId: data.VITE_GOOGLE_ANALYTICS_ID,
	sentryDsn: data.VITE_SENTRY_DSN,
	stripePublishableKey: data.VITE_STRIPE_PUBLISHABLE_KEY,
	logRocketKey: data.VITE_LOGROCKET_KEY,
	pusherKey: data.VITE_PUSHER_KEY ?? "",
	pusherCluster: data.VITE_PUSHER_CLUSTER ?? "eu",
	// Computed runtime values
	isDevelopment: import.meta.env.DEV,
	isProduction: import.meta.env.PROD,
	isPublicSite: data.VITE_SITE_TYPE === "public",
	isDashboardSite: data.VITE_SITE_TYPE === "dashboard",
	deployEnvironment,
	// Test (and local) APIs only accept superuser-created accounts.
	isPublicSignupEnabled: deployEnvironment === "production",
} as const;

export type Env = z.infer<typeof envSchema>;

if (env.isDevelopment) {
	console.log("[env]", {
		environment: env.appEnvironment,
		siteType: env.siteType ?? "not specified",
		apiBaseUrl: env.apiBaseUrl,
	});
}
