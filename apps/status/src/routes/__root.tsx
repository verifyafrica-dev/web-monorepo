import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TooltipProvider } from "@verifyafrica/ui/components/ui/tooltip";
import appCss from "../styles.css?url";

interface StatusRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<StatusRouterContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "VerifyAfrica Status" },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", href: "/favicon.ico" },
			{ rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body className="min-h-dvh bg-[#eef2f6]">
				<TooltipProvider delayDuration={100}>{children}</TooltipProvider>
				<Scripts />
			</body>
		</html>
	);
}
