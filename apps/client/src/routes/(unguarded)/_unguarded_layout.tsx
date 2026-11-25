import { createFileRoute, Outlet } from "@tanstack/react-router";
import { apiModeConfig, useApiModeStore } from "#/stores/api-mode-store";

export const Route = createFileRoute("/(unguarded)/_unguarded_layout")({
	head: () => ({
		meta: [
			{ title: "Authentication | VerifyAfrica" },
			{
				name: "description",
				content: "Access public authentication and verification entry pages.",
			},
		],
	}),
	component: GuestLayout,
});

/**
 * Login, signup, invites, and password reset only exist on Live. A Test session
 * is minted after sign-in, so these pages must not follow a saved Test mode.
 */
function ensurePublicRoutesUseLiveApi() {
	if (!apiModeConfig.switcherEnabled) return;

	const { mode, setMode, clearTestSession } = useApiModeStore.getState();
	if (mode === "live") return;

	clearTestSession();
	setMode("live");
}

function GuestLayout() {
	ensurePublicRoutesUseLiveApi();

	return (
		<div className="min-h-dvh bg-[#eef2f6] flex flex-col">
			<Outlet />
		</div>
	);
}
