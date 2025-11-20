"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";

const DashboardLayout = dynamic(() => import("./dashboard"), { ssr: false });

const NO_AUTH_ROUTES = ["/login"];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useMemo(() => new QueryClient(), []);
  const isPublicPage = NO_AUTH_ROUTES.includes(pathname);

  const [isReady, setIsReady] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token && !isPublicPage && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace("/login");
    } else if (token && pathname === "/login" && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace("/");
    } else {
      setIsReady(true); // ✅ Now safe to render dashboard
    }
  }, [pathname, isPublicPage, router]);

  if (!isReady && !isPublicPage) {
    return (
      <div className="flex items-center justify-center min-h-screen text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  return isPublicPage ? (
    <>{children}</>
  ) : (
    <QueryClientProvider client={queryClient}>
      <DashboardLayout>{children}</DashboardLayout>
    </QueryClientProvider>
  );
}
