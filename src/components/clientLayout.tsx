"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { createClient } from "../../lib/supabaseClient";

const DashboardLayout = dynamic(() => import("./dashboard"), { ssr: false });

const NO_AUTH_ROUTES = ["/login"];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useMemo(() => new QueryClient(), []);
  const isPublicPage = NO_AUTH_ROUTES.includes(pathname);
  const supabase = useMemo(() => createClient(), []);

  const [isReady, setIsReady] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const isAuthenticated = !!session;

        if (!isAuthenticated && !isPublicPage && !hasRedirected.current) {
          hasRedirected.current = true;
          router.replace("/login");
          return;
        }

        if (isAuthenticated && pathname === "/login" && !hasRedirected.current) {
          hasRedirected.current = true;
          router.replace("/");
          return;
        }

        setIsReady(true);
      } catch (error) {
        console.error("Auth check error:", error);
        // If there's an error and we're not on a public page, redirect to login
        if (!isPublicPage && !hasRedirected.current) {
          hasRedirected.current = true;
          router.replace("/login");
        } else {
          setIsReady(true);
        }
      }
    };

    checkAuth();
  }, [pathname, isPublicPage, router, supabase]);

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
