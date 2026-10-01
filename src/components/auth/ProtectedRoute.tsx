"use client";

import React from "react";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useRequireAuth();

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center text-white font-['Lato',sans-serif]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-[#3E8AFB] animate-spin" />
          <p className="text-white/70 text-sm animate-pulse">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
