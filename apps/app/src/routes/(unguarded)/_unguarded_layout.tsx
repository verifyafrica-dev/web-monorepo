import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(unguarded)/_unguarded_layout")({
	head: () => ({
		meta: [
			{ title: "Authentication | VerifyAfrica" },
			{ name: "description", content: "Access public authentication and verification entry pages." },
		],
	}),
	component: GuestLayout,
});

function GuestLayout() {
	return (
		<div className="min-h-screen bg-[#eef2f6]">
			<Outlet />
		</div>
	);
}
