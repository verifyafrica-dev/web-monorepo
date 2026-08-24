import { createFileRoute, Link, Navigate, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { Loader2Icon } from "lucide-react";
import { useMeV2Query, useUserV2LogoutMutation } from "#/api/http/v2/users/users.hooks";
import { AppSidebar } from "#/components/app-sidebar";
import { NoOrganizationState } from "#/components/no-organization-state";
import { Avatar, AvatarFallback, AvatarImage } from "@verifyafrica/ui/components/ui/avatar";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@verifyafrica/ui/components/ui/popover";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@verifyafrica/ui/components/ui/sidebar";
import { deleteAllCookies } from "@verifyafrica/ui/lib/cookies";
import { buildLoginRedirectUrl } from "@verifyafrica/ui/lib/redirect";
import { useAuthStore } from "#/stores/auth-store";
import { cn } from "@verifyafrica/ui/lib/utils";
import {
	getUserInitials,
	normalizeUserTenants,
} from "#/routes/(auth)/_auth_layout/app/team/-data";

const userMenuLinks = [
	{ label: "Profile", to: "/app/profile" },
	{ label: "My Team", to: "/app/team" },
] as const;

export const Route = createFileRoute("/(auth)/_auth_layout")({
	head: () => ({
		meta: [
			{ title: "Workspace | VerifyAfrica" },
			{ name: "description", content: "Access authenticated pages for your VerifyAfrica organization." },
		],
	}),
	component: AuthLayout,
});

function AuthLayout() {
	const location = useLocation();
	const navigate = useNavigate();
	const getUserQuery = useMeV2Query();
	const { logout, isLoggingOut } = useUserV2LogoutMutation();

	if (getUserQuery.isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Loader2Icon className="size-8 animate-spin text-primary" />
			</div>
		);
	}

	if (!getUserQuery.isLoading && !getUserQuery.data?.id) {
		deleteAllCookies();
		useAuthStore.getState().clearAuth();
		return <Navigate to={buildLoginRedirectUrl(location.pathname)} replace />;
	}

	const user = getUserQuery.data;
	const tenants = user ? normalizeUserTenants(user.tenants) : [];
	const displayName =
		[user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
		user?.email ||
		"";
	const initials = getUserInitials(displayName);

	if (tenants.length === 0) {
		return (
			<div className="flex min-h-screen flex-col">
				<header className="flex min-h-14 items-center justify-end border-b px-4">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => logout()}
						disabled={isLoggingOut}
					>
						Logout
					</Button>
				</header>
				<NoOrganizationState
					onCreated={() => {
						navigate({ to: "/app", replace: true });
					}}
				/>
			</div>
		);
	}

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset className="min-w-0">
				<header className="flex min-h-14 items-center gap-2 border-b px-4 justify-between">
					<SidebarTrigger />
					<Popover>
						<PopoverTrigger asChild>
							<button
								type="button"
								className="flex items-center gap-4 rounded-lg text-left outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
							>
								<Avatar>
									{user?.avatar_url ? (
										<AvatarImage src={user.avatar_url} alt={displayName} />
									) : null}
									<AvatarFallback>{initials}</AvatarFallback>
								</Avatar>
								<div>
									<p className="text-sm font-semibold">{displayName}</p>
									<p className="text-sm font-medium text-muted-foreground">
										{user?.email}
									</p>
								</div>
							</button>
						</PopoverTrigger>
						<PopoverContent align="end" className="w-40 gap-0 p-1">
							<nav className="flex flex-col">
								{userMenuLinks.map((item) => (
									<Link
										key={item.to}
										to={item.to}
										className={cn(
											"rounded-md px-3 py-2 text-sm font-medium transition-colors",
											"hover:bg-muted",
										)}
									>
										{item.label}
									</Link>
								))}
								<Button
									variant="ghost"
									size="sm"
									className="w-full justify-start px-3"
									onClick={() => logout()}
									disabled={isLoggingOut}
								>
									Logout
								</Button>
							</nav>
						</PopoverContent>
					</Popover>
				</header>
				<div className="flex min-w-0 flex-1 flex-col p-4">
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
