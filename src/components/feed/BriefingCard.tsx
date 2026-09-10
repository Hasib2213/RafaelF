"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Download, Sparkles, Check, Play, BookOpen, Volume2 } from "lucide-react";

export interface BriefingItem {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  channelName: string;
  subscribers: string;
  channelAvatarColor: string;
  channelInitials: string;
  summary: string;
  fullSummary?: string;
  keyTakeaways?: string[];
}

interface BriefingCardProps {
  briefing: BriefingItem;
  onOpenModal?: (briefing: BriefingItem) => void;
}

export default function BriefingCard({ briefing, onOpenModal }: BriefingCardProps) {
  const [downloaded, setDownloaded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  const [isSaved, setIsSaved] = useState(false);

  return (
    <div className="w-full sm:max-w-[291px] min-h-[434px] flex flex-col items-center rounded-2xl overflow-hidden border border-white/15 shadow-xl transition-all duration-300 hover:border-white/35 hover:-translate-y-1 hover:shadow-purple-950/40 bg-[#2B2A7D] [background-image:linear-gradient(90deg,rgba(43,127,255,0.2)_0%,rgba(79,57,246,0.2)_100%)] pb-4 isolate">
      {/* Card Thumbnail & Duration (Figma imgi_607_default 1 & Frame 2147239871) */}
      <div className="relative w-full h-[144px] shrink-0 bg-slate-800 overflow-hidden group rounded-t-2xl">
        <Image
          src={briefing.thumbnail}
          alt={briefing.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500 rounded-t-2xl"
          sizes="(max-width: 768px) 100vw, 291px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2B2A7D]/70 via-transparent to-black/20" />

        {/* Video Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm border border-white/50 flex items-center justify-center text-white shadow-lg">
            <Play className="w-4 h-4 fill-white ml-0.5" />
          </div>
        </div>

        {/* Duration Badge (Figma Frame 2147239871: 43px x 26px, top 10px, right 10px) */}
        <div className="absolute top-2.5 right-2.5 w-[43px] h-[26px] rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-xs font-normal text-white font-['Lato',sans-serif]">
          {briefing.duration}
        </div>
      </div>

      {/* Card Body (Figma Frame 2147239873: 259px x 258px, gap 12px) */}
      <div className="w-[259px] flex-1 flex flex-col justify-between gap-3 pt-3">
        {/* Video Title (Figma: 259px x 72px, 16px/150% semi-bold) */}
        <h3
          title={briefing.title}
          className="text-base font-semibold text-white leading-normal h-[72px] line-clamp-3 font-['Lato',sans-serif]"
        >
          {briefing.title}
        </h3>

        {/* Channel Profile Row (Figma Profile: 162px x 43px, gap 8px) */}
        <div className="flex items-center gap-2 h-[43px]">
          {/* Avatar (Figma Ellipse 2: 40px x 40px) */}
          <div
            className={`w-10 h-10 rounded-full bg-gradient-to-tr ${briefing.channelAvatarColor} ring-1 ring-white/30 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm`}
          >
            {briefing.channelInitials}
          </div>
          {/* Channel Text (Figma Frame 2147239872) */}
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-base font-semibold text-white truncate font-['Lato',sans-serif] -my-0.5">
              {briefing.channelName}
            </span>
            <span className="text-sm font-normal text-[#D0D0D0] truncate font-['Lato',sans-serif]">
              {briefing.subscribers}
            </span>
          </div>
        </div>

        {/* Summary Snippet (Figma: 259px x 63px, 14px/150% regular text-white) */}
        <div className="text-sm text-white font-normal leading-normal font-['Lato',sans-serif] min-h-[63px]">
          <p className={isExpanded ? "" : "line-clamp-3"}>
            {briefing.summary}
          </p>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-cyan-300 hover:text-cyan-200 text-xs font-medium inline-block select-none"
          >
            {isExpanded ? "Show less" : "Read more"}
          </button>
        </div>

        {/* Action Row (Figma Frame 2147239877: 259px x 44px, gap 12px) */}
        <div className="w-[259px] h-[44px] flex items-center gap-3 mt-auto">
          {/* Primary Action Button (Figma: 147px x 44px, gradient, radius 8px, gap 8px, Play Audio) */}
          <button
            type="button"
            onClick={() => onOpenModal?.(briefing)}
            className="w-[147px] h-[44px] px-2 rounded-lg bg-gradient-to-r from-[#2563EB] via-[#7A3BED] to-[#A842D4] hover:brightness-110 active:scale-95 text-white text-base font-semibold font-['Lato',sans-serif] flex items-center justify-center gap-2 shadow-md shadow-purple-900/30 transition-all select-none shrink-0"
          >
            {/* Exact Vector Play/Triangle Icon from Figma: 16px x 16px, stroke 1.33333px */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <path
                d="M4 2L13.3333 8L4 14V2Z"
                stroke="#FEFEFE"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="truncate">Play Audio</span>
          </button>

          {/* Download Button (Figma charm:download Icon Menu: 44px x 44px, radius 8px, bg white/20) */}
          <button
            type="button"
            onClick={handleDownload}
            title={downloaded ? "Downloaded!" : "Download Briefing Audio"}
            aria-label="Download Summary"
            className={`w-[44px] h-[44px] rounded-lg flex items-center justify-center transition-all select-none shrink-0 ${
              downloaded
                ? "bg-emerald-500/80 text-white"
                : "bg-white/20 hover:bg-white/30 text-white active:scale-95"
            }`}
          >
            {downloaded ? (
              <Check className="w-5 h-5 stroke-[3]" />
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 3V15M12 15L7.5 10.5M12 15L16.5 10.5M4 17V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V17"
                  stroke="#FEFEFE"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>

          {/* Bookmark / Library Button (Figma Frame Layer 2 Vector: 44px x 44px, radius 8px, bg white/20) */}
          <button
            type="button"
            onClick={() => setIsSaved(!isSaved)}
            title={isSaved ? "Saved to Library" : "Save to Library"}
            aria-label="Bookmark to Library"
            className={`w-[44px] h-[44px] rounded-lg flex items-center justify-center transition-all select-none shrink-0 ${
              isSaved
                ? "bg-purple-600/80 text-white"
                : "bg-white/20 hover:bg-white/30 text-white active:scale-95"
            }`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={isSaved ? "#FEFEFE" : "none"}
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 4C5 2.89543 5.89543 2 7 2H17C18.1046 2 19 2.89543 19 4V21L12 17.5L5 21V4Z"
                stroke="#FEFEFE"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
