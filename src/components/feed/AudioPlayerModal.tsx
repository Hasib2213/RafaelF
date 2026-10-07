"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { BriefingItem } from "./BriefingCard";
import { Check, Volume2, Sparkles, Loader2, Download } from "lucide-react";
import { libraryApi } from "@/lib/api";
import { downloadAudioFile } from "@/lib/utils";

interface AudioPlayerModalProps {
  briefing: BriefingItem;
  onClose: () => void;
  onOpenFeedback?: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlayerModal({
  briefing,
  onClose,
  onOpenFeedback,
}: AudioPlayerModalProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState("00:00");
  const [durationStr, setDurationStr] = useState(briefing.duration || "08:25");
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaved, setIsSaved] = useState(briefing.isSaved ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasAudioUrl, setHasAudioUrl] = useState(Boolean(briefing.audioUrl?.trim()));
  const [avatarError, setAvatarError] = useState(false);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const ttsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const ttsStartTimeRef = useRef<number>(0);
  const ttsEstimatedDurationRef = useRef<number>(60);

  // Sync saved state
  useEffect(() => {
    setIsSaved(briefing.isSaved ?? false);
  }, [briefing.isSaved, briefing.id]);

  // Audio setup and auto-play
  useEffect(() => {
    const audioUrl = briefing.audioUrl?.trim();
    if (audioUrl) {
      setHasAudioUrl(true);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      const onLoadedMetadata = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setDurationStr(formatTime(audio.duration));
        }
      };

      const onTimeUpdate = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          const percent = (audio.currentTime / audio.duration) * 100;
          setProgressPercent(percent);
          setCurrentTimeStr(formatTime(audio.currentTime));
        }
      };

      const onEnded = () => {
        setIsPlaying(false);
        setProgressPercent(0);
        setCurrentTimeStr("00:00");
      };

      const onError = () => {
        console.warn("[AudioPlayerModal] Audio failed to load. Falling back to SpeechSynthesis.");
        setHasAudioUrl(false);
      };

      audio.addEventListener("loadedmetadata", onLoadedMetadata);
      audio.addEventListener("timeupdate", onTimeUpdate);
      audio.addEventListener("ended", onEnded);
      audio.addEventListener("error", onError);

      // Attempt autoplay
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.log("[AudioPlayerModal] Autoplay prevented, waiting for user click:", err);
        setIsPlaying(false);
      });

      return () => {
        audio.pause();
        audio.removeEventListener("loadedmetadata", onLoadedMetadata);
        audio.removeEventListener("timeupdate", onTimeUpdate);
        audio.removeEventListener("ended", onEnded);
        audio.removeEventListener("error", onError);
        audioRef.current = null;
      };
    } else {
      // No Cloudinary audio file - use SpeechSynthesis
      setHasAudioUrl(false);
      startSpeechSynthesis();

      return () => {
        stopSpeechSynthesis();
      };
    }
  }, [briefing.audioUrl, briefing.id]);

  // SpeechSynthesis helpers
  const startSpeechSynthesis = (startOffsetPercent = 0) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const textToRead = briefing.fullSummary || briefing.summary || briefing.title || "";
    if (!textToRead.trim()) return;

    // Approximate duration: ~150 words per minute
    const wordCount = textToRead.split(/\s+/).length;
    const estSec = Math.max(15, Math.round((wordCount / 150) * 60));
    ttsEstimatedDurationRef.current = estSec;
    setDurationStr(formatTime(estSec));

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Try finding an English natural voice
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find((v) =>
      v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha"))
    ) || voices.find((v) => v.lang.startsWith("en"));
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onstart = () => {
      setIsPlaying(true);
      setTtsPlaying(true);
      ttsStartTimeRef.current = Date.now() - (startOffsetPercent / 100) * estSec * 1000;

      if (ttsIntervalRef.current) clearInterval(ttsIntervalRef.current);
      ttsIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - ttsStartTimeRef.current) / 1000;
        const pct = Math.min(100, (elapsed / estSec) * 100);
        setProgressPercent(pct);
        setCurrentTimeStr(formatTime(elapsed));
        if (pct >= 100) {
          if (ttsIntervalRef.current) clearInterval(ttsIntervalRef.current);
          setIsPlaying(false);
          setTtsPlaying(false);
        }
      }, 500);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setTtsPlaying(false);
      if (ttsIntervalRef.current) clearInterval(ttsIntervalRef.current);
      setProgressPercent(100);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setTtsPlaying(false);
      if (ttsIntervalRef.current) clearInterval(ttsIntervalRef.current);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeechSynthesis = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (ttsIntervalRef.current) clearInterval(ttsIntervalRef.current);
    setTtsPlaying(false);
  };

  const handlePlayPause = () => {
    if (hasAudioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    } else {
      // SpeechSynthesis toggle
      if (typeof window !== "undefined" && window.speechSynthesis) {
        if (isPlaying) {
          window.speechSynthesis.pause();
          setIsPlaying(false);
        } else {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
            setIsPlaying(true);
          } else {
            startSpeechSynthesis(progressPercent >= 100 ? 0 : progressPercent);
          }
        }
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPercent = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    setProgressPercent(newPercent);

    if (hasAudioUrl && audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (newPercent / 100) * audioRef.current.duration;
      setCurrentTimeStr(formatTime(audioRef.current.currentTime));
    } else {
      // Restart speech from estimated position
      startSpeechSynthesis(newPercent);
    }
  };

  const handleRewind = () => {
    if (hasAudioUrl && audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    } else {
      startSpeechSynthesis(0);
    }
  };

  const handleForward = () => {
    if (hasAudioUrl && audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 10);
    } else {
      startSpeechSynthesis(Math.min(95, progressPercent + 20));
    }
  };

  const handleDownload = async () => {
    if (isDownloading || isDownloaded || !briefing.audioUrl) return;
    setIsDownloading(true);
    try {
      const success = await downloadAudioFile(briefing.audioUrl, briefing.title);
      if (success) {
        setIsDownloaded(true);
        setTimeout(() => setIsDownloaded(false), 2500);
      }
    } catch (err) {
      console.error("Failed to download audio:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleToggleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(briefing.id);
    if (!isUuid) {
      console.warn(`[AudioPlayerModal] Skipping toggleSave API call: "${briefing.id}" is not a valid UUID.`);
      setIsSaving(false);
      return;
    }

    try {
      await libraryApi.toggleSave(briefing.id);
    } catch (err) {
      console.error("Failed to toggle save in AudioPlayerModal:", err);
      setIsSaved(!nextSaved);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 figma-backdrop-overlay animate-fadeIn"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.71)",
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
      }}
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        className="w-full max-w-[516px] h-[737px] max-h-[96vh] rounded-2xl overflow-hidden bg-[#2B2A7D] [background-image:linear-gradient(90deg,rgba(43,127,255,0.2)_0%,rgba(79,57,246,0.2)_100%)] shadow-[0px_4px_4px_rgba(0,0,0,0.15)] border border-white/20 flex flex-col relative select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Media Header */}
        <div className="relative w-full h-[240px] shrink-0 overflow-hidden bg-slate-900 rounded-t-2xl">
          <Image
            src={briefing.thumbnail}
            alt={briefing.title}
            fill
            className="object-cover"
            sizes="516px"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 via-70% to-black/85" />

          {/* Audio Source Badge */}
          <div className="absolute top-4 left-4 z-20">
            {hasAudioUrl ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950/80 text-[#36C1FB] border border-[#36C1FB]/40 backdrop-blur-md shadow-md">
                <Volume2 className="w-3.5 h-3.5" /> Cloud AI Audio
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-950/80 text-purple-300 border border-purple-400/40 backdrop-blur-md shadow-md">
                <Sparkles className="w-3.5 h-3.5" /> AI Speech Reader
              </span>
            )}
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 w-10 h-10 rounded-[18px] bg-black/50 hover:bg-black/70 active:scale-95 text-white flex items-center justify-center transition-all z-20 border border-white/20"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="#FEFEFE"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Progress Bar */}
          <div className="absolute left-4 right-4 bottom-14 z-20">
            <div
              className="w-full h-2 rounded-[13px] bg-white/30 relative cursor-pointer group"
              onClick={handleSeek}
            >
              {/* Active Bar */}
              <div
                className="h-2 rounded-[13px] bg-[#36C1FB] relative transition-all"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              >
                {/* Scrubber Knob */}
                <div className="absolute -right-2 -top-1 w-4 h-4 rounded-full bg-white border-2 border-[#36C1FB] shadow-md group-hover:scale-125 transition-transform" />
              </div>
            </div>

            {/* Timestamps */}
            <div className="flex justify-between items-center text-xs font-medium text-white/90 font-['Lato',sans-serif] mt-1.5 px-0.5">
              <span>{currentTimeStr}</span>
              <span>{durationStr}</span>
            </div>
          </div>

          {/* Player Controls */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
            {/* Rewind 10s */}
            <button
              type="button"
              aria-label="Rewind"
              onClick={handleRewind}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all text-white cursor-pointer"
              title="Rewind"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="#FEFEFE"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M6 6H8V18H6V6ZM18 6L9 12L18 18V6Z" />
              </svg>
            </button>

            {/* Play / Pause Toggle */}
            <button
              type="button"
              aria-label={isPlaying ? "Pause" : "Play"}
              onClick={handlePlayPause}
              className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#7A3BED] hover:brightness-110 active:scale-95 border border-white/40 flex items-center justify-center transition-all text-white shadow-lg cursor-pointer"
            >
              {isPlaying ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="#FEFEFE"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="#FEFEFE"
                  xmlns="http://www.w3.org/2000/svg"
                  className="ml-0.5"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Forward 10s */}
            <button
              type="button"
              aria-label="Forward"
              onClick={handleForward}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all text-white cursor-pointer"
              title="Forward"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="#FEFEFE"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M16 6H18V18H16V6ZM6 6L15 12L6 18V6Z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Body (Figma Frame 2147239865: 516px, padding 0 16px, gap 16px) */}
        <div className="flex-1 p-4 flex flex-col justify-between gap-3.5 overflow-y-auto">
          {/* Video Title (Figma: 484px x 48px, 16px semi-bold Lato) */}
          <h2 className="text-base font-semibold text-white leading-snug line-clamp-2 font-['Lato',sans-serif]">
            {briefing.title}
          </h2>

          {/* Channel Profile Row & Action Icons (Figma Profile: 484px x 44px) */}
          <div className="w-full flex items-center justify-between gap-2 h-11">
            {/* Left: Avatar & Channel Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/20 bg-slate-800 relative shadow-sm">
                {briefing.channelAvatar && !avatarError ? (
                  <Image
                    src={briefing.channelAvatar}
                    alt={briefing.channelName}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-gradient-to-tr ${briefing.channelAvatarColor || "from-purple-600 to-indigo-600"} flex items-center justify-center text-xs font-bold text-white`}
                  >
                    {briefing.channelInitials || briefing.channelName.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <span className="text-base font-semibold text-white truncate font-['Lato',sans-serif] -my-0.5">
                  {briefing.channelName}
                </span>
                <span className="text-sm font-normal text-[#D0D0D0] truncate font-['Lato',sans-serif]">
                  {briefing.subscribers}
                </span>
              </div>
            </div>

            {/* Right: Download & Bookmark Buttons (Figma Frame 2147239889: 96px x 44px) */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Download Button */}
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading || !briefing.audioUrl}
                title={
                  !briefing.audioUrl
                    ? "No audio available"
                    : isDownloading
                    ? "Downloading..."
                    : isDownloaded
                    ? "Downloaded!"
                    : "Download Audio"
                }
                className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all select-none ${
                  isDownloaded
                    ? "bg-emerald-500/80 text-white"
                    : isDownloading
                    ? "bg-purple-600/60 text-white cursor-wait"
                    : !briefing.audioUrl
                    ? "bg-white/10 text-white/40 cursor-not-allowed"
                    : "bg-white/20 hover:bg-white/30 text-white active:scale-95 cursor-pointer"
                }`}
              >
                {isDownloading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isDownloaded ? (
                  <Check className="w-5 h-5 stroke-[3]" />
                ) : (
                  <Download className="w-5 h-5 text-white" strokeWidth={1.8} />
                )}
              </button>

              {/* Bookmark Button */}
              <button
                type="button"
                onClick={handleToggleSave}
                title={isSaved ? "Saved to Library" : "Save to Library"}
                className={`w-[44px] h-[44px] rounded-lg flex items-center justify-center transition-all select-none shrink-0 cursor-pointer ${
                  isSaved
                    ? "bg-purple-600/80 hover:bg-purple-600 text-white shadow-md shadow-purple-900/30"
                    : "bg-white/20 hover:bg-white/30 text-white active:scale-95"
                }`}
              >
                <svg
                  width="44"
                  height="44"
                  viewBox="0 0 44 44"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-[44px] h-[44px]"
                >
                  {isSaved ? (
                    <path
                      d="M17.4163 13.0415H26.583C27.301 13.0424 27.9894 13.328 28.4971 13.8357C29.0048 14.3435 29.2905 15.0318 29.2913 15.7498V28.6665C29.2902 29.2741 29.0485 29.8565 28.619 30.2863C28.1895 30.7161 27.6073 30.9583 26.9997 30.9598L22.6247 28.2498C22.444 28.1155 22.2248 28.043 21.9997 28.043C21.7745 28.043 21.5554 28.1155 21.3747 28.2498L16.9997 30.9598C16.3921 30.9583 15.8099 30.7161 15.3804 30.2863C14.9509 29.8565 14.7092 29.2741 14.708 28.6665V15.7498C14.7089 15.0318 14.9945 14.3435 15.5022 13.8357C16.01 13.328 16.6983 13.0424 17.4163 13.0415Z"
                      fill="#FEFEFE"
                    />
                  ) : (
                    <path
                      d="M26.9997 30.9598C26.5035 30.96 26.0208 30.7985 25.6247 30.4998L22.6247 28.2498C22.444 28.1155 22.2248 28.043 21.9997 28.043C21.7745 28.043 21.5554 28.1155 21.3747 28.2498L18.3747 30.4998C18.0342 30.7552 17.6293 30.9107 17.2055 30.9489C16.7816 30.9871 16.3555 30.9066 15.9748 30.7162C15.5942 30.5259 15.274 30.2333 15.0503 29.8713C14.8265 29.5093 14.708 29.0921 14.708 28.6665V15.7498C14.7089 15.0318 14.9945 14.3435 15.5022 13.8357C16.01 13.328 16.6983 13.0424 17.4163 13.0415H26.583C27.301 13.0424 27.9894 13.328 28.4971 13.8357C29.0048 14.3435 29.2905 15.0318 29.2913 15.7498V28.6665C29.2902 29.2741 29.0485 29.8565 28.619 30.2863C28.1895 30.7161 27.6073 30.9583 26.9997 30.9598ZM26.3747 29.4998C26.5294 29.6159 26.7135 29.6866 26.9061 29.704C27.0988 29.7213 27.2925 29.6847 27.4655 29.5982C27.6385 29.5117 27.7841 29.3787 27.8858 29.2141C27.9875 29.0496 28.0413 28.86 28.0413 28.6665V15.7498C28.0409 15.3632 27.8871 14.9925 27.6137 14.7191C27.3403 14.4457 26.9696 14.2919 26.583 14.2915H17.4163C17.0297 14.2919 16.659 14.4457 16.3856 14.7191C16.1122 14.9925 15.9584 15.3632 15.958 15.7498V28.6665C15.958 28.86 16.0119 29.0496 16.1136 29.2141C16.2153 29.3787 16.3608 29.5117 16.5338 29.5982C16.7069 29.6847 16.9006 29.7213 17.0932 29.704C17.2859 29.6866 17.4699 29.6159 17.6247 29.4998L20.6247 27.2498C21.0221 26.954 21.5043 26.7942 21.9997 26.7942C22.4951 26.7942 22.9773 26.954 23.3747 27.2498L26.3747 29.4998Z"
                      fill="#FEFEFE"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Briefing Summary Description (Figma: 484px x 273px, 14px regular Lato) */}
          <div className="flex-1 bg-white/[0.06] rounded-xl p-3.5 border border-white/10 overflow-y-auto text-sm text-white font-normal leading-relaxed font-['Lato',sans-serif]">
            <p>
              {briefing.fullSummary ||
                "This motivational speech emphasizes taking full responsibility for your life and future. Matthew McConaughey encourages individuals to stop waiting for the “right moment” and start acting with purpose today. He highlights the importance of self-discipline, consistency, and embracing challenges as necessary steps toward growth. The message centers on becoming your best self by making better daily choices and staying committed to long-term goals. Instead of comparing yourself to others, focus on your own progress and define success on your own terms. Ultimately, the speech is a call to action: invest in yourself now, because your future depends on the decisions you make today."}
            </p>
          </div>

          {/* Write a feedback CTA (Figma Icon Menu: 484px x 44px, jam:write icon) */}
          <button
            type="button"
            onClick={() => {
              onOpenFeedback ? onOpenFeedback() : alert("Feedback form opening...");
            }}
            className="w-full h-11 rounded-lg bg-white/20 hover:bg-white/30 active:scale-[0.99] border border-white/10 text-white flex items-center justify-center gap-2 transition-all font-['Lato',sans-serif]"
          >
            {/* jam:write SVG Icon */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14.06 9.02L14.98 9.94L5.92 19H5V18.08L14.06 9.02ZM17.66 3C17.41 3 17.15 3.1 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C18.17 3.09 17.92 3 17.66 3ZM14.06 6.19L3 17.25V21H6.75L17.81 9.94L14.06 6.19Z"
                fill="#B5C8DB"
              />
            </svg>
            <span className="text-base font-semibold text-white">
              Write a feedback
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
