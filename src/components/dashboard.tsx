"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Button,
  cn,
  ScrollShadow,
  Spacer,
  Tooltip,
} from "@heroui/react";

import Sidebar from "@/components/sidebar/sidebar";
import { sectionItemsWithTeams } from "@/components/sidebar/sidebar-items";
import { Icon } from "@iconify/react";
import { useMediaQuery } from "usehooks-ts";
import { supabase } from "../../lib/supabaseClient";
import Image from "next/image";

type UserObject = {
  id: number;
  name: string;
  email: string;
  roles_name: string;
  branch_name: string;
  image: string;
  profile_url: string;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [userInfo, setUserInfo] = useState<UserObject | null>(null);
  const router = useRouter();

  const isCompact = isCollapsed || isMobile;

  const onToggle = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // ✅ Fetch user profile from Supabase
  useEffect(() => {
    const fetchUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) return;

      const { data, error } = await supabase.rpc("get_user_by_id", { _id: userId });

      if (error) {
        console.error("Error fetching profile:", error.message);
        return;
      }

      const profile = Array.isArray(data) ? data[0] : data;
      setUserInfo(profile);
    };

    fetchUser();
  }, []);

  return (
    <div className="dark text-foreground bg-background flex h-full w-full">
      <div
        className={cn(
          "dark text-foreground bg-background relative flex h-full w-60 flex-col !border-r-small border-divider p-6 transition-width",
          {
            "w-16 items-center px-2 py-6": isCompact,
          }
        )}
      >
        <div
          className={cn("flex items-center gap-3 px-3", {
            "justify-center gap-0": isCompact,
          })}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground">
            <Image
              src="/AAA_logo.png"
              alt="Logo"
              width={100}
              height={100}
              className="rounded-full"
            />
          </div>
          <span
            className={cn("text-small font-bold uppercase opacity-100", {
              "w-0 opacity-0": isCompact,
            })}
          >
            AAA School
          </span>
        </div>

        <Spacer y={8} />

        <ScrollShadow className="-mr-6 h-full max-h-full py-6 pr-6">
          <Sidebar
            defaultSelectedKey="home"
            isCompact={isCompact}
            items={sectionItemsWithTeams}
          />
        </ScrollShadow>

        <Spacer y={2} />
        <div
          className={cn("mt-auto flex flex-col", { "items-center": isCompact })}
        >
          <Tooltip content="Log Out" isDisabled={!isCompact} placement="right">
            <Button
              onPress={handleLogout}
              className={cn(
                "justify-start text-default-500 data-[hover=true]:text-foreground",
                {
                  "justify-center": isCompact,
                }
              )}
              isIconOnly={isCompact}
              startContent={
                !isCompact && (
                  <Icon
                    className="flex-none rotate-180 text-default-500"
                    icon="solar:minus-circle-line-duotone"
                    width={24}
                  />
                )
              }
              variant="light"
            >
              {isCompact ? (
                <Icon
                  className="rotate-180 text-default-500"
                  icon="solar:minus-circle-line-duotone"
                  width={24}
                />
              ) : (
                "Log Out"
              )}
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="w-full flex-1 flex-col flex h-screen overflow-hidden">
        <header className="flex items-center justify-between rounded-medium border-small border-divider p-4 mt-2">
          <div className="flex items-center gap-3">
            <Button isIconOnly size="sm" variant="light" onPress={onToggle}>
              <Icon
                className="text-default-500"
                height={24}
                icon="solar:sidebar-minimalistic-outline"
                width={24}
              />
            </Button>
            <h2 className="text-medium font-medium text-default-700">
              Overview
            </h2>
          </div>

          <div className="flex items-center gap-3 px-3">
            <Avatar
              isBordered
              className="flex-none"
              size="sm"
              src={userInfo?.profile_url || "/default-avatar.png"}
            />
            <div
              className={cn("flex max-w-full flex-col", { hidden: isCompact })}
            >
              <p className="truncate text-small font-medium text-default-600 capitalize">
                {userInfo?.name || "Loading..."}
              </p>
            </div>
          </div>
        </header>

        <main className="w-full h-screen overflow-hidden">
          <div className="flex w-full h-full overflow-auto flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
