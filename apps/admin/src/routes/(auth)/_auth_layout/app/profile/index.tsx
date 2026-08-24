import { ShieldCheckIcon, UserIcon } from "@phosphor-icons/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { useMeV2Query } from "#/api/http/v2/users/users.hooks";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@verifyafrica/ui/components/ui/card";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@verifyafrica/ui/components/ui/tabs";
import { ChangePasswordWithOtpTab } from "./-components/change-password-with-otp-tab";
import { UpdateProfileTab } from "./-components/update-profile-tab";

const profileSearchSchema = z.object({
	tab: z.enum(["profile", "password"]).optional(),
});

export const Route = createFileRoute("/(auth)/_auth_layout/app/profile/")({
	head: () => ({
		meta: [
			{ title: "Profile | VerifyAfrica" },
			{ name: "description", content: "Manage your admin profile details and account security settings." },
		],
	}),
	validateSearch: profileSearchSchema,
	component: ProfilePage,
});

function ProfilePage() {
	const navigate = useNavigate();
	const { tab } = Route.useSearch();
	const meQuery = useMeV2Query();
	const user = meQuery.data;
	const isLoading = meQuery.isPending || meQuery.isFetching;
	const activeTab = tab ?? "profile";

	useEffect(() => {
		if (!tab) {
			void navigate({
				to: "/app/profile",
				search: { tab: "profile" },
				replace: true,
			});
		}
	}, [navigate, tab]);

	if (meQuery.isError) {
		return (
			<Card className="mx-auto w-full max-w-3xl">
				<CardContent className="py-10 text-center text-sm text-muted-foreground">
					Failed to load profile. Please try again.
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="mx-auto w-full max-w-3xl">
			<CardHeader>
				<CardTitle className="text-xl font-semibold">
					Profile Settings
				</CardTitle>
				<CardDescription>
					Manage your profile and secure your admin account
				</CardDescription>
			</CardHeader>
			<CardContent>
				{isLoading || !user ? (
					<ProfilePageSkeleton />
				) : (
					<Tabs
						value={activeTab}
						onValueChange={(nextTab) => {
							void navigate({
								to: "/app/profile",
								search: {
									tab: nextTab as "profile" | "password",
								},
								replace: true,
							});
						}}
						className="flex w-full flex-col gap-6"
					>
						<TabsList>
							<TabsTrigger value="profile">
								<UserIcon />
								Profile
							</TabsTrigger>
							<TabsTrigger value="password">
								<ShieldCheckIcon />
								Change Password
							</TabsTrigger>
						</TabsList>

						<TabsContent value="profile">
							<UpdateProfileTab
								key={user.id}
								user={user}
							/>
						</TabsContent>
						<TabsContent value="password">
							<ChangePasswordWithOtpTab email={user.email} />
						</TabsContent>
					</Tabs>
				)}
			</CardContent>
		</Card>
	);
}

function ProfilePageSkeleton() {
	return (
		<>
			<div className="flex flex-col gap-1.5">
				<Skeleton className="h-7 w-40" />
				<Skeleton className="h-4 w-64" />
			</div>
			<Skeleton className="h-10 w-full max-w-md" />
			<div className="flex flex-col items-center gap-1.5">
				<Skeleton className="size-24 rounded-full" />
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				{["first", "last", "email", "phone"].map((field) => (
					<div
						key={field}
						className="flex flex-col gap-1.5"
					>
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-10 w-full" />
					</div>
				))}
			</div>
			<Skeleton className="h-10 w-full" />
		</>
	);
}
