"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Download, Check, Play, Bookmark } from "lucide-react";

export interface LibraryItem {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  channelName: string;
  subscribers: string;
  channelAvatar: string;
  summary: string;
  fullSummary?: string;
  keyTakeaways?: string[];
  savedAt?: string;
  category?: string;
}

interface LibraryCardProps {
  item: LibraryItem;
  onPlayAudio?: (item: LibraryItem) => void;
  onRemove?: (id: string) => void;
}

export default function LibraryCard({ item, onPlayAudio, onRemove }: LibraryCardProps) {
  const [downloaded, setDownloaded] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isSaved;
    setIsSaved(nextState);
    if (!nextState && onRemove) {
      onRemove(item.id);
    }
  };

  return (
    <div className="w-full max-w-[370px] min-h-[428px] rounded-2xl flex flex-col items-center pb-4 gap-4 border border-white/15 shadow-xl transition-all duration-300 hover:border-white/35 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(43,42,125,0.45)] bg-[#2B2A7D] [background-image:linear-gradient(90deg,rgba(43,127,255,0.2)_0%,rgba(79,57,246,0.2)_100%)] isolate overflow-hidden">
      {/* 1. Video Thumbnail (Figma imgi_607_default 1: 370px x 183px, rounded 16px 16px 0px 0px) */}
      <div className="relative w-full h-[183px] shrink-0 bg-slate-800 overflow-hidden group">
        {!imgError ? (
          <Image
            src={item.thumbnail}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 370px"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-800 to-indigo-900 text-white/50 text-sm">
            Saved Briefing
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#2B2A7D]/70 via-transparent to-black/20" />

        {/* Play Overlay on Hover */}
        <div
          onClick={() => onPlayAudio?.(item)}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/35 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm border border-white/50 flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>

        {/* Duration Badge (Figma Frame 2147239871: 43px x 26px, top 10px, right 10px, rgba(0,0,0,0.6)) */}
        <div className="absolute top-2.5 right-2.5 w-[43px] h-[26px] rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-xs font-normal text-white font-['Lato',sans-serif]">
          {item.duration}
        </div>
      </div>

      {/* 2. Card Content Body (Figma Frame 2147239873: width 370px, padding 0px 16px, gap 12px) */}
      <div className="w-full px-4 flex-1 flex flex-col justify-between gap-3">
        {/* Title: (Figma: width 338px, height 48px, 16px Lato semibold) */}
        <h3
          title={item.title}
          className="text-white text-base font-semibold font-['Lato',sans-serif] leading-[150%] h-[48px] line-clamp-2"
        >
          {item.title}
        </h3>

        {/* Profile Row: (Figma Profile: width 162px, height 43px, gap 8px) */}
        <div className="flex items-center gap-2 h-[43px]">
          {/* Avatar (Figma Ellipse 2: 40px x 40px) */}
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/20 bg-slate-800 relative">
            <Image
              src={item.channelAvatar}
              alt={item.channelName}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Name & Subscribers (Figma Frame 2147239872: width 114px, height 43px) */}
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-white text-base font-semibold font-['Lato',sans-serif] leading-[150%] truncate -my-0.5">
              {item.channelName}
            </span>
            <span className="text-[#D0D0D0] text-sm font-normal font-['Lato',sans-serif] leading-[150%] truncate">
              {item.subscribers}
            </span>
          </div>
        </div>

        {/* Description Snippet: (Figma: width 338px, height 42px, 14px Lato regular) */}
        <div className="w-full min-h-[42px] text-white text-sm font-normal font-['Lato',sans-serif] leading-[150%]">
          <p className={isExpanded ? "" : "line-clamp-2"}>
            {item.summary}
            {!isExpanded ? (
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="text-[#36C1FB] hover:underline ml-1 font-medium cursor-pointer"
              >
                Read more
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-[#36C1FB] hover:underline ml-1 font-medium cursor-pointer"
              >
                Read less
              </button>
            )}
          </p>
        </div>

        {/* Actions Row: (Figma Frame 2147239877: width 338px, height 44px, gap 12px) */}
        <div className="w-full h-11 flex items-center gap-3 mt-auto">
          {/* Primary Play Button (Figma Primary button: width 226px, height 44px) */}
          <button
            type="button"
            onClick={() => onPlayAudio?.(item)}
            className="flex-1 h-11 px-3 rounded-lg bg-[linear-gradient(89.44deg,#2563EB_-47.4%,#7A3BED_76.5%,#A842D4_101.93%)] text-white text-base font-semibold font-['Lato',sans-serif] leading-[150%] flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-indigo-900/40 cursor-pointer select-none"
          >
            {/* 16px Play Triangle Vector */}
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

          {/* Download Button (Figma Icon Menu: width 44px, height 44px, rgba(255,255,255,0.2)) */}
          <button
            type="button"
            onClick={handleDownload}
            title={downloaded ? "Downloaded!" : "Download Audio Briefing"}
            aria-label="Download Audio"
            className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all cursor-pointer select-none shrink-0 ${
              downloaded
                ? "bg-emerald-500/80 text-white"
                : "bg-white/20 hover:bg-white/30 active:scale-95 text-white border border-white/10"
            }`}
          >
            {downloaded ? (
              <Check className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <Download className="w-5 h-5 text-white" strokeWidth={1.8} />
            )}
          </button>

          {/* Bookmark / Library Button (Figma Icon Menu: width 44px, height 44px, rgba(255,255,255,0.2)) */}
          <button
            type="button"
            onClick={handleToggleSave}
            title={isSaved ? "Saved to Library (click to remove)" : "Save to Library"}
            aria-label="Bookmark Video"
            className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all cursor-pointer select-none shrink-0 ${
              isSaved
                ? "bg-purple-600/80 text-white border border-purple-400/40 shadow-sm"
                : "bg-white/20 hover:bg-white/30 active:scale-95 text-white border border-white/10"
            }`}
          >
            <Bookmark
              className={`w-5 h-5 text-white ${isSaved ? "fill-white" : ""}`}
              strokeWidth={1.8}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
