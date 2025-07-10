"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import DashboardLayout from "./dashboard";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const noAuthRoutes = ["/login"]; 
  useEffect(() => {
    const isAuthRoute = noAuthRoutes.includes(pathname);
    const authToken = localStorage.getItem("authToken");

    if (!authToken && !isAuthRoute) {
      router.push("/login");
    }
    if (authToken && pathname === "/login") {
      router.push("/");
    }
  }, [pathname, router]);

  const isDashboardVisible = !noAuthRoutes.includes(pathname);

  return <>{isDashboardVisible ? <DashboardLayout>{children}</DashboardLayout> : children}</>;
}
