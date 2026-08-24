import {
	BuildingsIcon,
	CaretRightIcon,
	CaretUpDownIcon,
	CheckIcon,
	ClipboardTextIcon,
	CreditCardIcon,
	HouseIcon,
	type IconWeight,
	PlusIcon,
	ShieldCheckIcon,
	SquaresFourIcon,
	UserCircleIcon,
	UsersThreeIcon,
	WebhooksLogoIcon,
} from "@phosphor-icons/react";
import { Link, useRouterState } from "@tanstack/react-router";
import type { ComponentType, SVGProps } from "react";
import * as React from "react";
import { CreateOrganizationDialog } from "#/components/create-organization-dialog";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@verifyafrica/ui/components/ui/collapsible";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@verifyafrica/ui/components/ui/popover";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	// SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	useSidebar,
} from "@verifyafrica/ui/components/ui/sidebar";
import { cn } from "#/lib/utils.ts";
import {
	getUserInitials,
	ROLE_LABELS,
	useCurrentTenant,
} from "#/routes/(auth)/_auth_layout/app/team/-data";
import { toast } from "sonner";

const teamSubItems = [
	{ title: "Active Users", to: "/app/team/active-users" },
	{ title: "Invitations", to: "/app/team/invitations" },
] as const;

const navItems = [
	{
		title: "Dashboard",
		to: "/app",
		icon: HouseIcon,
		isExact: true,
	},
	{
		title: "Products",
		to: "/app/products",
		icon: SquaresFourIcon,
	},
	{
		title: "Reports",
		to: "/app/reports",
		icon: ClipboardTextIcon,
	},
	{
		title: "Profile",
		to: "/app/profile",
		icon: UserCircleIcon,
	},
	{
		title: "KYC",
		to: "/app/kyc",
		icon: ShieldCheckIcon,
	},
	{
		title: "Webhooks",
		to: "/app/webhooks",
		icon: WebhooksLogoIcon,
	},
	{
		title: "Billing",
		to: "/app/billing",
		icon: CreditCardIcon,
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

function SidebarTeamNav() {
	const { isTenantAdmin } = useCurrentTenant();
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const isTeamActive = pathname.startsWith("/app/team");
	const [isOpen, setIsOpen] = React.useState(isTeamActive);
	const visibleTeamItems = isTenantAdmin
		? teamSubItems
		: teamSubItems.filter((item) => item.to !== "/app/team/invitations");

	React.useEffect(() => {
		if (isTeamActive) {
			setIsOpen(true);
		}
	}, [isTeamActive]);

	return (
		<Collapsible
			open={isOpen}
			onOpenChange={setIsOpen}
			className="group/collapsible"
		>
			<SidebarMenuItem>
				<CollapsibleTrigger asChild>
					<SidebarMenuButton
						tooltip="My Team"
						isActive={isTeamActive}
						className={cn(
							"bg-transparent hover:bg-transparent active:bg-transparent",
							"data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground data-active:hover:bg-sidebar-accent",
						)}
					>
						<UsersThreeIcon weight={isTeamActive ? "bold" : "regular"} />
						<span className="font-medium">My Team</span>
						<CaretRightIcon
							className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-90"
							weight="bold"
						/>
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<SidebarMenuSub>
						{visibleTeamItems.map((item) => {
							const isActive =
								pathname === item.to || pathname === `${item.to}/`;

							return (
								<SidebarMenuSubItem key={item.to}>
									<SidebarMenuSubButton
										asChild
										isActive={isActive}
									>
										<Link to={item.to}>{item.title}</Link>
									</SidebarMenuSubButton>
								</SidebarMenuSubItem>
							);
						})}
					</SidebarMenuSub>
				</CollapsibleContent>
			</SidebarMenuItem>
		</Collapsible>
	);
}

function OrganizationSwitcher() {
	const { isMobile, state } = useSidebar();
	const { tenant, tenants, ownsOrganization, setSelectedTenantId } =
		useCurrentTenant();
	const [open, setOpen] = React.useState(false);
	const [createOpen, setCreateOpen] = React.useState(false);

	if (!tenant) {
		return null;
	}

	const tenantInitials = getUserInitials(tenant.name);
	const roleLabel = ROLE_LABELS[tenant.role];

	return (
		<>
			<Popover
				open={open}
				onOpenChange={setOpen}
			>
				<PopoverTrigger asChild>
					<SidebarMenuButton
						size="lg"
						tooltip={tenant.name}
						className={cn(
							"data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
							"transition-transform active:scale-[0.96] flex-1",
						)}
					>
						<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
							{tenantInitials ? (
								<span className="text-xs font-semibold tabular-nums">
									{tenantInitials}
								</span>
							) : (
								<BuildingsIcon
									className="size-4"
									weight="bold"
								/>
							)}
						</div>
						<div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
							<span className="truncate font-semibold">{tenant.name}</span>
							<span className="truncate text-xs text-muted-foreground">
								{roleLabel}
							</span>
						</div>
						<CaretUpDownIcon className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
					</SidebarMenuButton>
				</PopoverTrigger>
				<PopoverContent
					align="start"
					side={isMobile || state === "collapsed" ? "bottom" : "right"}
					sideOffset={4}
					className="w-64 gap-1 p-1"
				>
					<p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
						Organizations
					</p>
					<div className="flex flex-col">
						{tenants.map((membership) => {
							const isSelected = membership.id === tenant.id;

							return (
								<button
									key={membership.id}
									type="button"
									className={cn(
										"flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm outline-none",
										"transition-[background-color,color,transform] active:scale-[0.96]",
										"hover:bg-accent hover:text-accent-foreground",
										"focus-visible:ring-2 focus-visible:ring-ring",
										isSelected && "bg-accent/60",
									)}
									onClick={() => {
										setSelectedTenantId(membership.id);
										toast.success(`Switched to ${membership.name}`);
										setOpen(false);
									}}
								>
									<div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">
										{getUserInitials(membership.name)}
									</div>
									<div className="grid min-w-0 flex-1 leading-tight">
										<span className="truncate font-medium">
											{membership.name}
										</span>
										<span className="truncate text-xs text-muted-foreground">
											{ROLE_LABELS[membership.role]}
										</span>
									</div>
									{isSelected ? (
										<CheckIcon
											className="size-4 shrink-0 text-primary"
											weight="bold"
										/>
									) : null}
								</button>
							);
						})}
					</div>
					{!ownsOrganization ? (
						<>
							<div className="my-1 h-px bg-border" />
							<button
								type="button"
								className={cn(
									"flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm outline-none",
									"transition-[background-color,color,transform] active:scale-[0.96]",
									"hover:bg-accent hover:text-accent-foreground",
									"focus-visible:ring-2 focus-visible:ring-ring",
								)}
								onClick={() => {
									setOpen(false);
									setCreateOpen(true);
								}}
							>
								<div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-dashed bg-background">
									<PlusIcon
										className="size-4"
										weight="bold"
									/>
								</div>
								<span className="font-medium">Create organization</span>
							</button>
						</>
					) : null}
				</PopoverContent>
			</Popover>

			<CreateOrganizationDialog
				open={createOpen}
				onOpenChange={setCreateOpen}
			/>
		</>
	);
}

export function AppSidebar() {
	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className="gap-0 border-b border-sidebar-border p-0">
				<div className="flex items-center justify-between">
					<Link
						to="/app"
						className="flex min-h-14 max-h-14 items-center justify-center px-4 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
					>
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
					</Link>
					<OrganizationSwitcher />
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map((item) => (
								<SidebarNavItem
									key={item.to}
									item={item}
								/>
							))}
							<SidebarTeamNav />
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter></SidebarFooter>
		</Sidebar>
	);
}
