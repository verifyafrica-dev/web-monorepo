import {
	createFileRoute,
	Link,
	Navigate,
	Outlet,
	useLocation,
} from "@tanstack/react-router";
import { Loader2Icon } from "lucide-react";
import {
	useMeV2Query,
	useUserV2LogoutMutation,
} from "#/api/http/v2/users/users.hooks";
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
import { AppSidebar } from "#/components/app-sidebar";
import { deleteAllCookies } from "#/lib/cookies";
import { buildLoginRedirectUrl } from "#/lib/redirect";
import { useAuthStore } from "#/stores/auth-store";
import { getUserInitials } from "#/lib/user";

export const Route = createFileRoute("/(auth)/_auth_layout")({
	head: () => ({
		meta: [
			{ title: "Admin Workspace | VerifyAfrica" },
			{ name: "description", content: "Access authenticated admin pages and manage platform operations." },
		],
	}),
	component: AuthLayout,
});

function AuthLayout() {
	const location = useLocation();
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
		return (
			<Navigate
				to={buildLoginRedirectUrl(location.pathname)}
				replace
			/>
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
