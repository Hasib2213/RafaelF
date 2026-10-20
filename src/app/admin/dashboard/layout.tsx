"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { authApi } from "@/lib/api";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAdminAuth() {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("curio_admin_token") || localStorage.getItem("curio_access_token");
      const storedAdmin = localStorage.getItem("curio_admin_user");

      if (!token) {
        localStorage.removeItem("curio_admin_user");
        localStorage.removeItem("curio_admin_token");
        router.replace("/admin/login");
        return;
      }

      // Check locally stored admin info first
      let currentLocalAdmin: any = null;
      try {
        if (storedAdmin) {
          currentLocalAdmin = JSON.parse(storedAdmin);
        }
      } catch {
        // ignore parse error
      }

      if (
        currentLocalAdmin &&
        currentLocalAdmin.role !== "admin" &&
        !currentLocalAdmin.is_staff &&
        !currentLocalAdmin.is_superuser
      ) {
        localStorage.removeItem("curio_admin_user");
        localStorage.removeItem("curio_admin_token");
        router.replace("/admin/login?error=unauthorized");
        return;
      }

      // Verify session and role directly with the backend profile endpoint
      try {
        const profile = await authApi.getProfile();
        if (!isMounted) return;

        if (
          !profile ||
          (profile.role !== "admin" && !profile.is_staff && !profile.is_superuser)
        ) {
          localStorage.removeItem("curio_admin_user");
          localStorage.removeItem("curio_admin_token");
          router.replace("/admin/login?error=unauthorized");
          return;
        }

        // Active session confirmed as admin
        localStorage.setItem("curio_admin_user", JSON.stringify(profile));
        setIsAuthorized(true);
      } catch {
        if (!isMounted) return;
        localStorage.removeItem("curio_admin_user");
        localStorage.removeItem("curio_admin_token");
        router.replace("/admin/login");
      }
    }

    checkAdminAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center text-white font-['Lato',sans-serif]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-[#2563EB] animate-spin" />
          <p className="text-white/70 text-sm animate-pulse">Verifying admin credentials...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
