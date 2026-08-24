/**
 * Environment Configuration
 *
 * This file provides type-safe access to environment variables.
 * All variables must be prefixed with VITE_ to be accessible in the browser.
 */

const DEV_API_PORT = 8300;

function getDevApiBaseUrl() {
  const hostname = import.meta.env.VITE_DEV_NETWORK_IP || "127.0.0.1";
  return `http://${hostname}:${DEV_API_PORT}/api`;
}

export const env = {
  // API Configuration
  apiBaseUrl: import.meta.env.DEV
    ? getDevApiBaseUrl()
    : import.meta.env.VITE_API_BASE_URL,

  // App Configuration
  appName: import.meta.env.VITE_APP_NAME || 'Verify Africa',
  appEnvironment: import.meta.env.VITE_APP_ENVIRONMENT || 'development',
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

  // Firebase (client-side web SDK — apiKey is public; restrict via Firebase console rules)
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
  },

  // Computed values
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  isPublicSite: import.meta.env.VITE_SITE_TYPE === 'public',
  isDashboardSite: import.meta.env.VITE_SITE_TYPE === 'dashboard',
} as const;

// Helper to log environment info (development only)
if (env.isDevelopment) {
  console.log('🔧 Environment Config:', {
    environment: env.appEnvironment,
    siteType: env.siteType || 'not specified',
    apiBaseUrl: env.apiBaseUrl,
  });
}
