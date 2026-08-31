import { z } from "zod";

const envSchema = z.object({
	VITE_API_BASE_URL: z.url(),
	VITE_APP_NAME: z.string().default("Verify Africa"),
	VITE_APP_ENVIRONMENT: z.string().default("development"),
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
});

const parsed = envSchema.safeParse(import.meta.env);
if (!parsed.success) {
	console.error("[env] Invalid environment configuration:");
	console.error(parsed.error.flatten().fieldErrors);
	throw new Error("Invalid environment configuration");
}

const data = parsed.data;

export const env = {
	...parsed.data,
	// Backward-compatible app config accessors
	apiBaseUrl: data.VITE_API_BASE_URL,
	appName: data.VITE_APP_NAME,
	appEnvironment: data.VITE_APP_ENVIRONMENT,
	siteType: data.VITE_SITE_TYPE,
	enableAnalytics: data.VITE_ENABLE_ANALYTICS === "true",
	enableDebug: data.VITE_ENABLE_DEBUG === "true",
	landingPageVersion: data.VITE_LANDING_PAGE_VERSION,
	googleAnalyticsId: data.VITE_GOOGLE_ANALYTICS_ID,
	sentryDsn: data.VITE_SENTRY_DSN,
	stripePublishableKey: data.VITE_STRIPE_PUBLISHABLE_KEY,
	logRocketKey: data.VITE_LOGROCKET_KEY,
	// Computed runtime values
	isDevelopment: import.meta.env.DEV,
	isProduction: import.meta.env.PROD,
	isPublicSite: data.VITE_SITE_TYPE === "public",
	isDashboardSite: data.VITE_SITE_TYPE === "dashboard",
} as const;

export type Env = z.infer<typeof envSchema>;

if (env.isDevelopment) {
	console.log("[env]", {
		environment: env.appEnvironment,
		siteType: env.siteType ?? "not specified",
		apiBaseUrl: env.apiBaseUrl,
	});
}
