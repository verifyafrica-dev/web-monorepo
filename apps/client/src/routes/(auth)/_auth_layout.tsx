import {
	createFileRoute,
	Link,
	Outlet,
	useLocation,
	useNavigate,
} from "@tanstack/react-router";
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
import { deleteAllCookies } from "@verifyafrica/ui/lib/cookies";
import { buildLoginRedirectUrl } from "@verifyafrica/ui/lib/redirect";
import { cn } from "@verifyafrica/ui/lib/utils";
import { Loader2Icon } from "lucide-react";
import { useEffect, useRef } from "react";
import {
	useMeV2Query,
	useUserV2LogoutMutation,
} from "#/api/http/v2/users/users.hooks";
import { ACCOUNT_BLOCKED_STORAGE_KEY } from "#/components/account-blocked-dialog";
import { AppSidebar } from "#/components/app-sidebar";
import { TestModeBanner } from "#/components/environment-mode-switcher";
import { EnvironmentSwitchOverlay } from "#/components/environment-switch-overlay";
import { NoOrganizationState } from "#/components/no-organization-state";
import { PresenceConnector } from "#/components/presence-connector";
import { RequiredPasswordChange } from "#/components/required-password-change";
import { isTestAccountBlockedError } from "#/lib/test-account-blocked";
import {
	getUserInitials,
	normalizeUserTenants,
} from "#/routes/(auth)/_auth_layout/app/team/-data";
import { useAuthStore } from "#/stores/auth-store";

const userMenuLinks = [
	{ label: "Profile", to: "/app/profile" },
	{ label: "My Team", to: "/app/team" },
] as const;

export const Route = createFileRoute("/(auth)/_auth_layout")({
	head: () => ({
		meta: [
			{ title: "Workspace | VerifyAfrica" },
			{
				name: "description",
				content:
					"Access authenticated pages for your VerifyAfrica organization.",
			},
		],
	}),
	component: AuthLayout,
});

function forceLoginRedirect(redirectPath: string, markBlocked = false) {
	if (markBlocked) {
		try {
			sessionStorage.setItem(ACCOUNT_BLOCKED_STORAGE_KEY, "1");
		} catch {
			// sessionStorage may be unavailable
		}
	}
	deleteAllCookies();
	useAuthStore.getState().clearAuth();
	try {
		localStorage.removeItem("auth-store");
		localStorage.removeItem("api-mode-store");
	} catch {
		// localStorage may be unavailable
	}
	window.location.assign(buildLoginRedirectUrl(redirectPath));
}

function AuthLayout() {
	const location = useLocation();
	const navigate = useNavigate();
	const getUserQuery = useMeV2Query();
	const { logout, isLoggingOut } = useUserV2LogoutMutation();
	const blockedToastShown = useRef(false);
	const loginRedirectStarted = useRef(false);

	useEffect(() => {
		if (!getUserQuery.isError || blockedToastShown.current) return;
		if (!isTestAccountBlockedError(getUserQuery.error)) return;
		blockedToastShown.current = true;
		try {
			sessionStorage.setItem(ACCOUNT_BLOCKED_STORAGE_KEY, "1");
		} catch {
			// sessionStorage may be unavailable
		}
	}, [getUserQuery.isError, getUserQuery.error]);

	useEffect(() => {
		if (loginRedirectStarted.current) return;
		if (getUserQuery.isPending && !getUserQuery.isError) return;
		if (!getUserQuery.isError && getUserQuery.data?.id) return;
		loginRedirectStarted.current = true;
		forceLoginRedirect(
			location.href,
			Boolean(
				getUserQuery.isError &&
					isTestAccountBlockedError(getUserQuery.error),
			),
		);
	}, [
		getUserQuery.isPending,
		getUserQuery.isError,
		getUserQuery.error,
		getUserQuery.data?.id,
		location.href,
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

	if (user?.must_change_password) {
		return <RequiredPasswordChange />;
	}

	const tenants = user ? normalizeUserTenants(user.tenants) : [];
	const accessibleTenants = tenants.filter((tenant) => !tenant.access_restricted);
	const displayName =
		[user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
		user?.email ||
		"";
	const initials = getUserInitials(displayName);

	// All memberships restricted (e.g. Test access disabled) — same modal as login.
	if (tenants.length > 0 && accessibleTenants.length === 0) {
		if (!loginRedirectStarted.current) {
			loginRedirectStarted.current = true;
			forceLoginRedirect(location.href, true);
		}
		return (
			<div className="flex min-h-dvh items-center justify-center">
				<Loader2Icon className="size-8 animate-spin text-primary" />
			</div>
		);
	}

	if (tenants.length === 0) {
		return (
			<div className="flex min-h-dvh flex-col">
				<PresenceConnector enabled={Boolean(user?.id)} />
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
			<EnvironmentSwitchOverlay />
			<PresenceConnector enabled={Boolean(user?.id)} />
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
