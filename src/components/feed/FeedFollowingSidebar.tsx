"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { creatorsApi } from "@/lib/api";

function SidebarChannelAvatar({
  name,
  avatarUrl,
  gradient,
  initials,
}: {
  name: string;
  avatarUrl?: string;
  gradient: string;
  initials: string;
}) {
  const [hasError, setHasError] = useState(false);
  if (avatarUrl && !hasError) {
    return (
      <div className="relative w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/30 shrink-0 bg-slate-800">
        <Image
          src={avatarUrl}
          alt={name}
          fill
          unoptimized
          className="object-cover"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }
  return (
    <div
      className={`w-10 h-10 rounded-full bg-gradient-to-tr ${gradient} ring-1 ring-white/30 shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-sm`}
    >
      {initials}
    </div>
  );
}

export default function FeedFollowingSidebar() {
  const [channels, setChannels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChannels = async () => {
      setIsLoading(true);
      try {
        let list: any[] = [];
        try {
          list = await creatorsApi.getFollowing();
        } catch {
          list = [];
        }
        if (!list || list.length === 0) {
          const all = await creatorsApi.list();
          list = Array.isArray(all) ? all : all.results || [];
        }
        setChannels(list || []);
      } catch (err) {
        console.error("Failed to fetch channels:", err);
        setChannels([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannels();
  }, []);

  return (
    <aside className="w-[239px] shrink-0 min-h-screen border-l border-white/20 p-4 hidden xl:flex flex-col gap-3 z-30 bg-[#2B2A7D] [background-image:linear-gradient(90deg,rgba(43,127,255,0.2)_0%,rgba(79,57,246,0.2)_100%)]">
      {/* Section Heading */}
      <div className="pb-2 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white font-['Lato',sans-serif]">
          Following
        </h2>
        <Link
          href="/following"
          className="text-xs text-purple-300 hover:text-white transition-colors"
        >
          View all
        </Link>
      </div>

      {/* Channels List */}
      <div className="flex flex-col gap-1.5 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="w-full h-14 p-2 rounded-lg flex items-center gap-2.5 animate-pulse bg-white/5"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <div className="h-3.5 bg-white/10 rounded w-24" />
                  <div className="h-2.5 bg-white/10 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : channels.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#D0D0D0]/70 font-['Lato',sans-serif]">
            No creators followed yet.
          </div>
        ) : (
          channels.map((channel) => {
            const gradient = channel.avatar_gradient || channel.avatarColor || "from-purple-600 to-indigo-600";
            const initials = channel.initials || (channel.name ? channel.name.slice(0, 2).toUpperCase() : "CR");
            const avatarSrc = channel.avatar_url || channel.avatar;

            return (
              <Link
                key={channel.id}
                href={`/following`}
                className="w-full h-14 p-2 rounded-lg flex items-center justify-between gap-2 hover:bg-white/10 active:bg-white/20 transition-all text-left group select-none cursor-pointer"
              >
                {/* Left: Avatar & Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <SidebarChannelAvatar
                    name={channel.name}
                    avatarUrl={avatarSrc}
                    gradient={gradient}
                    initials={initials}
                  />

                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-white truncate font-['Lato',sans-serif] group-hover:text-cyan-300 transition-colors">
                      {channel.name}
                    </span>
                    <span className="text-xs text-[#D0D0D0] truncate font-['Lato',sans-serif]">
                      {channel.subscriber_count || channel.subscribers}
                    </span>
                  </div>
                </div>

                {/* Right: Chevron */}
                <ChevronRight className="w-4 h-4 text-[#B5C8DB] group-hover:translate-x-0.5 group-hover:text-white transition-all shrink-0" />
              </Link>
            );
          })
        )}
      </div>
    </aside>
  );
}
