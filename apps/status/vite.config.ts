import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { PORTLESS_HOSTS } from "@verifyafrica/config/domains";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const config = defineConfig({
	server: {
		allowedHosts: [PORTLESS_HOSTS.status],
	},
	resolve: {
		tsconfigPaths: true,
	},
	plugins: [nitro(), tailwindcss(), tanstackStart(), viteReact()],
});

export default config;
