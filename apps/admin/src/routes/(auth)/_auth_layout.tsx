import {
	createFileRoute,
	Link,
	Outlet,
	useLocation,
} from "@tanstack/react-router";
import { getV2ErrorMessage } from "@verifyafrica/api-client/http/shared";
import { Loader2Icon } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
	useMeV2Query,
	useUserV2LogoutMutation,
} from "#/api/http/v2/users/users.hooks";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@verifyafrica/ui/components/ui/avatar";
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
import { AppSidebar } from "#/components/app-sidebar";
import { PresenceConnector } from "#/components/presence-connector";
import { TestModeBanner } from "#/components/environment-mode-switcher";
import { EnvironmentSwitchOverlay } from "#/components/environment-switch-overlay";
import { deleteAllCookies } from "@verifyafrica/ui/lib/cookies";
import { buildLoginRedirectUrl } from "@verifyafrica/ui/lib/redirect";
import { isTestAccountBlockedError } from "#/lib/test-account-blocked";
import { useAuthStore } from "#/stores/auth-store";
import { getUserInitials } from "#/lib/user";

export const Route = createFileRoute("/(auth)/_auth_layout")({
	head: () => ({
		meta: [
			{ title: "Admin Workspace | VerifyAfrica" },
			{
				name: "description",
				content:
					"Access authenticated admin pages and manage platform operations.",
			},
		],
	}),
	component: AuthLayout,
});

function forceLoginRedirect(pathname: string) {
	deleteAllCookies();
	useAuthStore.getState().clearAuth();
	try {
		localStorage.removeItem("auth-store");
		localStorage.removeItem("admin-api-mode-store");
		localStorage.removeItem("api-mode-store");
	} catch {
		// localStorage may be unavailable
	}
	window.location.assign(buildLoginRedirectUrl(pathname));
}

function AuthLayout() {
	const location = useLocation();
	const getUserQuery = useMeV2Query();
	const { logout, isLoggingOut } = useUserV2LogoutMutation();
	const blockedToastShown = useRef(false);
	const loginRedirectStarted = useRef(false);

	useEffect(() => {
		if (!getUserQuery.isError || blockedToastShown.current) return;
		if (!isTestAccountBlockedError(getUserQuery.error)) return;
		blockedToastShown.current = true;
		toast.error(getV2ErrorMessage(getUserQuery.error), { duration: 12_000 });
	}, [getUserQuery.isError, getUserQuery.error]);

	useEffect(() => {
		if (loginRedirectStarted.current) return;
		if (getUserQuery.isPending && !getUserQuery.isError) return;
		if (!getUserQuery.isError && getUserQuery.data?.id) return;
		loginRedirectStarted.current = true;
		forceLoginRedirect(location.pathname);
	}, [
		getUserQuery.isPending,
		getUserQuery.isError,
		getUserQuery.data?.id,
		location.pathname,
	]);

	if (getUserQuery.isPending && !getUserQuery.isError) {
		return (
			<div className="flex min-h-dvh items-center justify-center">
				<Loader2Icon className="size-8 animate-spin text-primary" />
			</div>
		);
	}

	if (getUserQuery.isError || !getUserQuery.data?.id) {
		return (
			<div className="flex min-h-dvh items-center justify-center">
				<Loader2Icon className="size-8 animate-spin text-primary" />
			</div>
		);
	}

	const user = getUserQuery.data;
	const displayName =
		[user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
		user?.email ||
		"";
	const initials = getUserInitials(displayName);

	return (
		<SidebarProvider>
			<EnvironmentSwitchOverlay />
			<PresenceConnector
				enabled={Boolean(user?.id)}
				listenForAdminUpdates
			/>
			<AppSidebar />
			<SidebarInset className="min-w-0">
				<TestModeBanner />
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
										<AvatarImage
											src={user.avatar_url}
											alt={displayName}
										/>
									) : null}
									<AvatarFallback>{initials}</AvatarFallback>
								</Avatar>
								<div>
									<p className="text-sm font-semibold capitalize">
										{displayName}
									</p>
									<p className="text-sm font-medium text-muted-foreground">
										{user?.email}
									</p>
								</div>
							</button>
						</PopoverTrigger>
						<PopoverContent
							align="end"
							className="w-40 gap-0 p-1"
						>
							<Button
								variant="ghost"
								size="sm"
								className="w-full justify-start px-3"
								asChild
							>
								<Link to="/app/profile">Profile</Link>
							</Button>
							<Button
								variant="ghost"
								size="sm"
								className="w-full justify-start px-3"
								onClick={() => logout()}
								disabled={isLoggingOut}
							>
								Logout
							</Button>
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
