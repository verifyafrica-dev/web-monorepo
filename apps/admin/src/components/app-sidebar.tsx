import {
	BuildingsIcon,
	ClockCounterClockwiseIcon,
	CreditCardIcon,
	GearIcon,
	HouseIcon,
	ReceiptIcon,
	SquaresFourIcon,
	UserCircleIcon,
	UsersIcon,
	WebhooksLogoIcon,
	type IconWeight,
} from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import type { ComponentType, SVGProps } from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@verifyafrica/ui/components/ui/sidebar";
import { cn } from "#/lib/utils.ts";

const navItems = [
	{
		title: "Dashboard",
		to: "/app",
		icon: HouseIcon,
		isExact: true,
	},
	{
		title: "Tenants",
		to: "/app/tenants",
		icon: BuildingsIcon,
	},
	{
		title: "Users",
		to: "/app/users",
		icon: UsersIcon,
	},
	{
		title: "Profile",
		to: "/app/profile",
		icon: UserCircleIcon,
	},
	{
		title: "Top-ups",
		to: "/app/top-ups",
		icon: CreditCardIcon,
	},
	{
		title: "Invoices",
		to: "/app/invoices",
		icon: ReceiptIcon,
	},
	{
		title: "Verification Settings",
		to: "/app/verification-settings",
		icon: GearIcon,
	},
	{
		title: "Mixed Verifications",
		to: "/app/mixed-verifications",
		icon: SquaresFourIcon,
	},
	{
		title: "Activity Logs",
		to: "/app/activity-logs",
		icon: ClockCounterClockwiseIcon,
	},
	{
		title: "Webhooks",
		to: "/app/webhooks",
		icon: WebhooksLogoIcon,
	},
] as const;

function SidebarNavItem({
	item,
}: {
	item: {
		title: string;
		to: (typeof navItems)[number]["to"];
		icon: ComponentType<SVGProps<SVGSVGElement> & { weight?: IconWeight }>;
		isExact?: boolean;
	};
}) {
	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				asChild
				className={cn(
					"bg-transparent hover:bg-transparent active:bg-transparent",
					"aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-medium aria-[current=page]:text-sidebar-accent-foreground aria-[current=page]:hover:bg-sidebar-accent",
				)}
			>
				<Link
					to={item.to}
					activeOptions={item.isExact ? { exact: true } : undefined}
				>
					{({ isActive }) => (
						<>
							<item.icon weight={isActive ? "bold" : "regular"} />
							<span className="font-medium">{item.title}</span>
						</>
					)}
				</Link>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
}

export function AppSidebar() {
	return (
		<Sidebar collapsible="icon">
			<Link to="/app">
				<SidebarHeader className="flex min-h-14 max-h-14 items-center border-b border-sidebar-border px-4 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
					<picture className="group-data-[collapsible=icon]:hidden">
						<img
							src="/assets/brand/logo.svg"
							alt="VerifyAfrica"
							className="h-12 w-auto"
						/>
					</picture>
					<picture className="hidden group-data-[collapsible=icon]:block">
						<img
							src="/assets/brand/logo-square.svg"
							alt="VerifyAfrica"
							className="size-8"
						/>
					</picture>
				</SidebarHeader>
			</Link>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map((item) => (
								<SidebarNavItem key={item.to} item={item} />
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
