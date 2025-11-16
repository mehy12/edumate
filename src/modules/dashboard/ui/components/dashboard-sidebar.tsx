"use client";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { BotIcon, VideoIcon, StarIcon, HomeIcon, MapIcon, UsersIcon, User as UserIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DashboardUserButton from "./dashboard-user-button";

const firstSection = [
  {
    icon: HomeIcon,
    label: "Home",
    href: "/",
  },
  {
    icon: VideoIcon,
    label: "Meetings",
    href: "/meetings",
  },
  {
    icon: BotIcon,
    label: "Agents",
    href: "/agents",
  },
  {
    icon: MapIcon,
    label: "Roadmaps",
    href: "/roadmaps",
  },
  {
    icon: StarIcon,
    label: "Enroll",
    href: "/enroll",
  },
  {
    icon: UsersIcon,
    label: "Community",
    href: "/community",
  },
  {
    icon: UserIcon,
    label: "Profile",
    href: "/profile",
  },
];
const secondSection = [
  {
    icon: StarIcon,
    label: "Upgrade",
    href: "/upgrade",
  },
];
export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="text-sidebar-accent-foreground">
        <Link href={"/"} className="flex items-center gap-2 px-2 pt-2 ">
          <Image
            src={"/logo-futuristic.svg"}
            alt="MeetAI"
            height={36}
            width={36}
          />
          <p className="text-2xl font-semibold">MeetAI</p>
        </Link>
      </SidebarHeader>
      <div className="px-4 py-2">
        <Separator className="opacity-80 text-[#5d6b68]" />
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {firstSection.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href + "/"));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        "h-10 border border-transparent bg-[var(--sidebar)]",
                        "hover:border-[#592E83]/20",
                        isActive &&
                          "border-[#9984D4]/20 bg-[linear-gradient(to_right,var(--sidebar-accent)_5%,var(--sidebar-primary)_30%,var(--sidebar)_100%)]"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-5" />
                        <span className="text-sm font-medium tracking-tight">
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="px-4 py-2">
          <Separator className="opacity-80 text-[#575757]" />
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondSection.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "h-10 border border-transparent bg-[var(--sidebar)]",
                      "hover:border-[#592E83]/20",
                      pathname === item.href &&
                        "border-[#9984D4]/20 bg-[linear-gradient(to_right,var(--sidebar-accent)_5%,var(--sidebar-primary)_30%,var(--sidebar)_100%)]"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-5" />
                      <span className="text-sm font-medium tracking-tight">
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="text-white">
        <DashboardUserButton />
      </SidebarFooter>
    </Sidebar>
  );
}
