import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(unguarded)/_unguarded_layout")({
	head: () => ({
		meta: [
			{ title: "Admin Authentication | VerifyAfrica" },
			{ name: "description", content: "Access public admin authentication pages to sign in and recover access." },
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
