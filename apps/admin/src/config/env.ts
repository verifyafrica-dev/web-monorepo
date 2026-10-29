/**
 * Environment Configuration
 *
 * This file provides type-safe access to environment variables.
 * All variables must be prefixed with VITE_ to be accessible in the browser.
 */

import { detectDeployEnvironment } from '@verifyafrica/config/domains';

function optionalEnvUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
const liveApiBaseUrl = optionalEnvUrl(
  import.meta.env.VITE_LIVE_API_BASE_URL as string | undefined,
);
const testApiBaseUrl = optionalEnvUrl(
  import.meta.env.VITE_TEST_API_BASE_URL as string | undefined,
);

// Prefer Live URL for deploy detection on production builds; else the single API URL.
// Derived from env rather than window.location so SSR and hydration agree.
const detectionUrl = liveApiBaseUrl ?? apiBaseUrl;
const deployEnvironment = detectionUrl
  ? detectDeployEnvironment(new URL(detectionUrl).host)
  : 'local';

export const env = {
  // API Configuration
  apiBaseUrl,
  liveApiBaseUrl,
  testApiBaseUrl,

  // App Configuration
  appName: import.meta.env.VITE_APP_NAME || 'Verify Africa',
  appEnvironment: import.meta.env.VITE_APP_ENVIRONMENT || 'development',
  /** Mirrors backend ENV_STATE: production | sandbox | dev. Unused in UI yet. */
  envState: (import.meta.env.VITE_ENV_STATE || 'dev') as 'production' | 'sandbox' | 'dev',
  siteType: import.meta.env.VITE_SITE_TYPE as 'public' | 'client' | 'admin' | undefined,

  // Feature Flags
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  landingPageVersion: (import.meta.env.VITE_LANDING_PAGE_VERSION || 'v1') as 'v1' | 'v2' | 'v3' || 'v1',

  // Third-party Services
  googleAnalyticsId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  logRocketKey: import.meta.env.VITE_LOGROCKET_KEY,
  pusherKey: import.meta.env.VITE_PUSHER_KEY ?? '',
  pusherCluster: import.meta.env.VITE_PUSHER_CLUSTER ?? 'eu',

  // Computed values
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  isPublicSite: import.meta.env.VITE_SITE_TYPE === 'public',
  isDashboardSite: import.meta.env.VITE_SITE_TYPE === 'dashboard',
  deployEnvironment,
  // Mirrors the backend: superusers create accounts only where public signup is off.
  isTestAccountCreationEnabled: deployEnvironment !== 'production',
} as const;

// Helper to log environment info (development only)
if (env.isDevelopment) {
  console.log('🔧 Environment Config:', {
    environment: env.appEnvironment,
    siteType: env.siteType || 'not specified',
    apiBaseUrl: env.apiBaseUrl,
  });
}
