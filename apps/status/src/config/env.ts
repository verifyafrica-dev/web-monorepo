import { z } from "zod";

const envSchema = z.object({
	VITE_API_BASE_URL: z.url(),
	/** Mirrors backend ENV_STATE. Unused in UI yet. */
	VITE_ENV_STATE: z.enum(["production", "sandbox", "dev"]).optional().default("dev"),
});

const parsed = envSchema.safeParse(import.meta.env);
if (!parsed.success) {
	console.error("[env] Invalid environment configuration:");
	console.error(parsed.error.flatten().fieldErrors);
	throw new Error("Invalid environment configuration");
}

export const env = {
	apiBaseUrl: parsed.data.VITE_API_BASE_URL,
	envState: parsed.data.VITE_ENV_STATE,
};
