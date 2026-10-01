"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const adminUser = localStorage.getItem("curio_admin_user");
      const token = localStorage.getItem("curio_access_token");

      if (!adminUser || !token) {
        router.replace("/admin/login");
        return;
      }
      setIsAuthorized(true);
    }
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
