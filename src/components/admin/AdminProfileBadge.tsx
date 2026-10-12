"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { resolveAvatarUrl } from "@/lib/api";

interface AdminProfileBadgeProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function AdminProfileBadge({ className, style }: AdminProfileBadgeProps) {
  const { user } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [localAdmin, setLocalAdmin] = useState<{
    name?: string;
    avatar?: string;
    role?: string;
  } | null>(null);

  useEffect(() => {
    // Read fallback from localStorage if context is still loading
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("curio_admin_user") || localStorage.getItem("curio_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          const name = parsed.full_name || `${parsed.first_name || ""} ${parsed.last_name || ""}`.trim() || parsed.email?.split("@")[0];
          setLocalAdmin({
            name,
            avatar: parsed.avatar_url || parsed.avatar,
            role: parsed.role === "admin" || parsed.is_staff ? "Admin" : (parsed.role || "Admin"),
          });
        }
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  const rawAvatar = user?.avatar_url || user?.avatar || localAdmin?.avatar;
  const avatarUrl = resolveAvatarUrl(rawAvatar);

  useEffect(() => {
    setImageError(false);
  }, [rawAvatar]);

  const displayName = user
    ? user.full_name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email?.split("@")[0] || "Abir Hossain"
    : localAdmin?.name || "Abir Hossain";

  const displayRole = user?.role === "admin" || user?.is_staff
    ? "Admin"
    : user?.role || localAdmin?.role || "Admin";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "AH";

  return (
    <div
      className={
        className ||
        "h-11 px-3 py-1 rounded-[8px] flex items-center gap-2.5 shrink-0 select-none"
      }
      style={{
        width: "135px",
        background: "rgba(255,255,255,0.2)",
        border: "1px solid rgba(255,255,255,0.1)",
        ...style,
      }}
    >
      {avatarUrl && !imageError ? (
        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/40 shrink-0 shadow-md bg-slate-800">
          <Image
            src={avatarUrl}
            alt={displayName}
            fill
            unoptimized
            onError={() => setImageError(true)}
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/40 bg-gradient-to-tr from-[#3E8AFB] to-[#9369FD] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
          {initials}
        </div>
      )}
      <div className="flex flex-col text-left min-w-0">
        <span className="font-['Lato'] font-medium text-[14px] leading-[150%] text-white truncate -my-0.5">
          {displayName}
        </span>
        <span className="font-['Lato'] font-normal text-[12px] leading-[150%] text-[#D0D0D0]">
          {displayRole}
        </span>
      </div>
    </div>
  );
}
