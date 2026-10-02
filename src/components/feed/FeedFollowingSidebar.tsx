"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Users, Loader2 } from "lucide-react";
import { creatorsApi } from "@/lib/api";
import { Creator } from "@/lib/types/api";

const DEFAULT_CHANNELS = [
  {
    id: "1",
    name: "Motiversity",
    subscribers: "4.11M subscribers",
    avatar_url: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
    avatar_gradient: "from-purple-600 to-indigo-600",
    initials: "M",
    handle: "@motiversity",
  },
  {
    id: "2",
    name: "Huberman Lab",
    subscribers: "5.82M subscribers",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    avatar_gradient: "from-blue-600 to-cyan-600",
    initials: "HL",
    handle: "@hubermanlab",
  },
  {
    id: "3",
    name: "Lex Fridman",
    subscribers: "4.29M subscribers",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    avatar_gradient: "from-zinc-700 to-zinc-900",
    initials: "LF",
    handle: "@lexfridman",
  },
  {
    id: "4",
    name: "Ali Abdaal",
    subscribers: "5.45M subscribers",
    avatar_url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
    avatar_gradient: "from-emerald-500 to-teal-700",
    initials: "AA",
    handle: "@aliabdaal",
  },
  {
    id: "5",
    name: "TED Talks",
    subscribers: "24.1M subscribers",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    avatar_gradient: "from-red-600 to-rose-700",
    initials: "TED",
    handle: "@tedtalks",
  },
];

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
  const [channels, setChannels] = useState<any[]>(DEFAULT_CHANNELS);
  const [isLoading, setIsLoading] = useState(false);

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
        if (list && list.length > 0) {
          setChannels(list);
        }
      } catch (err) {
        console.error("Failed to fetch channels:", err);
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
        {isLoading && channels.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-white/60">
            <Loader2 className="w-5 h-5 animate-spin" />
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
