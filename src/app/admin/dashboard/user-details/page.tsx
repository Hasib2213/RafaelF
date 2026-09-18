"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  SuspendUserIcon,
  StatCalendarIcon,
  StatVideoIcon,
  ChannelsFollowingVideoIcon,
  StatPlaylistIcon,
  StatPackageIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  YellowStarIcon,
  SidePanelCurioBrand,
  SideNavDashboardIcon,
  SideNavUsersIcon,
  SideNavSubscriptionIcon,
  SideNavAdminSettingsIcon,
  SideNavPlatformSettingIcon,
  SideNavReviewsIcon,
  SideNavLogoutIcon,
  ModalWarningAlertIcon,
} from "./UserDetailsIcons";

interface PurchaseHistoryItem {
  id: string;
  paymentDate: string;
  cardNumber: string;
  subscriptionType: "Pro(Monthly)" | "Enterprise(Yearly)";
  amount: string;
}

interface ActivityItem {
  id: string;
  title: string;
  timestamp: string;
  rating?: number;
  type: "book" | "bookmark" | "subscription" | "audio" | "review" | "streak" | "security";
}

const PURCHASE_HISTORY: PurchaseHistoryItem[] = [
  { id: "row-1", paymentDate: "03:35 PM, Jun 25, 2025", cardNumber: "123 1234 235 245", subscriptionType: "Pro(Monthly)", amount: "$12.00" },
  { id: "row-2", paymentDate: "03:35 PM, Jun 25, 2025", cardNumber: "123 1234 235 245", subscriptionType: "Enterprise(Yearly)", amount: "$12.00" },
  { id: "row-3", paymentDate: "03:35 PM, Jun 25, 2025", cardNumber: "123 1234 235 245", subscriptionType: "Pro(Monthly)", amount: "$12.00" },
  { id: "row-4", paymentDate: "03:35 PM, Jun 25, 2025", cardNumber: "123 1234 235 245", subscriptionType: "Enterprise(Yearly)", amount: "$12.00" },
  { id: "row-5", paymentDate: "03:35 PM, Jun 25, 2025", cardNumber: "123 1234 235 245", subscriptionType: "Pro(Monthly)", amount: "$12.00" },
  { id: "row-6", paymentDate: "03:35 PM, Jun 25, 2025", cardNumber: "123 1234 235 245", subscriptionType: "Enterprise(Yearly)", amount: "$12.00" },
  { id: "row-7", paymentDate: "03:35 PM, Jun 25, 2025", cardNumber: "123 1234 235 245", subscriptionType: "Pro(Monthly)", amount: "$12.00" },
];

const RECENT_ACTIVITIES: ActivityItem[] = [
  {
    id: "act-1",
    title: "Finished reading 'The Great Gatsby'",
    timestamp: "2 hours ago",
    rating: 5.0,
    type: "book",
  },
  {
    id: "act-2",
    title: "Added 'Atomic Habits' to Bookmarks",
    timestamp: "5 hours ago",
    type: "bookmark",
  },
  {
    id: "act-3",
    title: "Upgraded to Pro (Monthly) Plan",
    timestamp: "1 day ago",
    type: "subscription",
  },
  {
    id: "act-4",
    title: "Listened to Chapter 4 of 'Sapiens: A Brief History'",
    timestamp: "2 days ago",
    type: "audio",
  },
  {
    id: "act-5",
    title: "Reviewed '1984' by George Orwell",
    timestamp: "3 days ago",
    rating: 4.8,
    type: "review",
  },
  {
    id: "act-6",
    title: "Completed 30-day Reading Streak! 🏆",
    timestamp: "5 days ago",
    type: "streak",
  },
  {
    id: "act-7",
    title: "Logged in from Chrome on MacOS (Los Angeles, USA)",
    timestamp: "1 week ago",
    type: "security",
  },
];

export default function UserDetailsPage() {
  const [isSuspended, setIsSuspended] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(7);
  const [activeTab, setActiveTab] = useState("overview");

  const handleSuspendToggle = () => {
    if (isSuspended) {
      if (confirm("Are you sure you want to lift the suspension for this user?")) {
        setIsSuspended(false);
      }
    } else {
      setShowSuspendModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-row overflow-x-hidden selection:bg-[#3E8AFB]/30 selection:text-white">
      {/* -------------------------------------------------------------
          LEFT SIDE PANEL (Exact Figma Side Panel: 240px x 806px+)
      ------------------------------------------------------------- */}
      <aside className="w-[240px] shrink-0 border-r border-white/20 flex flex-col justify-between p-4 sticky top-0 h-screen z-30 bg-[#2B2A7D] bg-gradient-to-r from-[rgba(43,127,255,0.2)] to-[rgba(79,57,246,0.2)]">
        <div className="flex flex-col gap-6 w-full">
          {/* Header Brand (Frame 6) */}
          <div className="w-full pb-4 border-b border-white/20 flex items-center">
            <Link href="/admin/dashboard" className="transition-transform hover:scale-[1.02]">
              <SidePanelCurioBrand />
            </Link>
          </div>

          {/* Navigation Items (Frame 2147239856) */}
          <nav className="flex flex-col gap-2 w-full">
            {/* Dashboard Overview (Active indicator) */}
            <Link
              href="/admin/dashboard"
              className="w-full h-12 flex items-center gap-3 pl-3 pr-4 rounded-lg bg-white/20 border-l-4 border-[#2563EB] text-white transition-all hover:bg-white/[0.25]"
            >
              <SideNavDashboardIcon />
              <span className="font-['Lato'] font-medium text-base">Dashboard Overview</span>
            </Link>

            {/* User Management (Desktop - 25) */}
            <Link
              href="/admin/dashboard/users"
              className="w-full h-12 flex items-center gap-3 px-4 rounded-lg transition-all text-left text-[#B5C8DB] hover:text-white hover:bg-white/10"
            >
              <SideNavUsersIcon />
              <span className="font-['Inter'] font-normal text-base tracking-tight">User Management</span>
            </Link>

            {/* Subscription plan */}
            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`w-full h-12 flex items-center gap-3 px-4 rounded-lg transition-all text-left ${activeTab === "subscriptions"
                  ? "bg-white/20 border-l-4 border-[#2563EB] text-white"
                  : "text-[#B5C8DB] hover:text-white hover:bg-white/10"
                }`}
            >
              <SideNavSubscriptionIcon />
              <span className="font-['Inter'] font-normal text-base tracking-tight">Subscription plan</span>
            </button>

            {/* Admin Settings */}
            <button
              onClick={() => setActiveTab("admin-settings")}
              className={`w-full h-12 flex items-center gap-3 px-4 rounded-lg transition-all text-left ${activeTab === "admin-settings"
                  ? "bg-white/20 border-l-4 border-[#2563EB] text-white"
                  : "text-[#B5C8DB] hover:text-white hover:bg-white/10"
                }`}
            >
              <SideNavAdminSettingsIcon />
              <span className="font-['Inter'] font-normal text-base tracking-tight">Admin Settings</span>
            </button>

            {/* Platform Setting */}
            <button
              onClick={() => setActiveTab("platform-settings")}
              className={`w-full h-12 flex items-center gap-3 px-4 rounded-lg transition-all text-left ${activeTab === "platform-settings"
                  ? "bg-white/20 border-l-4 border-[#2563EB] text-white"
                  : "text-[#B5C8DB] hover:text-white hover:bg-white/10"
                }`}
            >
              <SideNavPlatformSettingIcon />
              <span className="font-['Inter'] font-normal text-base tracking-tight">Platform Setting</span>
            </button>

            {/* User Reviews */}
            <button
              onClick={() => setActiveTab("reviews")}
              className={`w-full h-12 flex items-center gap-3 px-4 rounded-lg transition-all text-left ${activeTab === "reviews"
                  ? "bg-white/20 border-l-4 border-[#2563EB] text-white"
                  : "text-[#B5C8DB] hover:text-white hover:bg-white/10"
                }`}
            >
              <SideNavReviewsIcon />
              <span className="font-['Inter'] font-normal text-base tracking-tight">User Reviews</span>
            </button>
          </nav>
        </div>

        {/* Log Out Button (Frame 2147239891) */}
        <div className="w-full pt-4 border-t border-white/10">
          <button
            onClick={() => {
              if (confirm("Are you sure you want to log out of Admin Panel?")) {
                window.location.href = "/login";
              }
            }}
            className="w-full h-12 flex items-center gap-3 pl-3 pr-4 rounded-lg bg-white/20 border-l-[3px] border-[#FF5B5B] text-white hover:bg-white/[0.28] transition-all cursor-pointer"
          >
            <SideNavLogoutIcon />
            <span className="font-['Lato'] font-normal text-base tracking-tight">Log Out</span>
          </button>
        </div>
      </aside>

      {/* -------------------------------------------------------------
          MAIN CONTENT AREA (Nav Bar + Profile + Stats + Lower Section)
      ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP NAV BAR (Figma Nav: 1200px x 80px style) */}
        <header className="h-20 w-full px-6 lg:px-8 border-b border-white/20 flex items-center justify-between sticky top-0 z-20 shadow-[0px_1px_12px_rgba(0,0,0,0.05)] bg-[#2B2A7D] bg-gradient-to-r from-[rgba(79,57,246,0.2)] to-[rgba(43,127,255,0.2)]">
          {/* Left: Navigation back to overview & breadcrumb */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2 text-sm text-[#B5C8DB] hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Overview</span>
            </Link>
            <span className="text-white/30 hidden sm:inline">/</span>
            <span className="text-sm font-medium text-white hidden sm:inline">User Details</span>
          </div>

          {/* Right: Admin Profile Badge (Frame 2147239857) */}
          <div className="flex items-center gap-5">
            <div className="h-11 px-3 py-1 rounded-lg bg-white/20 flex items-center gap-2.5 border border-white/10">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/40 bg-gradient-to-tr from-[#3E8AFB] to-[#9369FD] flex items-center justify-center text-white font-bold text-xs">
                AH
              </div>
              <div className="flex flex-col">
                <span className="font-['Lato'] font-medium text-sm text-white leading-tight">Abir Hossain</span>
                <span className="font-['Lato'] font-normal text-xs text-[#D0D0D0] leading-tight">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE BODY CONTAINER (Max width 1152px centered inside workspace) */}
        <main className="flex-1 p-6 lg:p-8 flex flex-col gap-6 max-w-[1200px] w-full mx-auto">
          {/* =========================================================
              PROFILE HEADER CARD (Frame 2147240232)
          ========================================================= */}
          <section className="w-full rounded-2xl overflow-hidden pb-6 border border-white/10 shadow-2xl bg-[#2B2A7D] bg-gradient-to-r from-[rgba(43,127,255,0.2)] to-[rgba(79,57,246,0.2)]">
            {/* Scenic Cover Banner (129px) */}
            <div className="w-full h-32 relative bg-gradient-to-r from-[#1A1A4E] via-[#2A3B8C] to-[#1F2554] overflow-hidden">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#3E8AFB_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="absolute right-0 top-0 w-96 h-32 bg-gradient-to-l from-indigo-500/20 to-transparent blur-2xl" />
            </div>

            {/* Profile Avatar & Info Content */}
            <div className="px-6 lg:px-8 -mt-16 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
              {/* Left: Avatar + Details */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
                {/* 200px Avatar with 1px border */}
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border border-white p-1 bg-[#2B2A7D] shrink-0 shadow-xl overflow-hidden relative group">
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#181F40] relative">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80"
                      alt="Lebron James Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isSuspended && (
                    <div className="absolute inset-0 bg-red-900/80 rounded-full flex items-center justify-center text-xs font-bold uppercase tracking-wider text-white">
                      Suspended
                    </div>
                  )}
                </div>

                {/* User Information */}
                <div className="flex flex-col gap-1 pb-2">
                  <div className="flex items-center gap-3">
                    <h1 className="font-['Lato'] font-semibold text-2xl sm:text-3xl text-white tracking-tight">
                      Lebron James
                    </h1>
                    {isSuspended ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 border border-red-500/40 text-red-300">
                        Suspended
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                        Active User
                      </span>
                    )}
                  </div>
                  <span className="font-['Inter'] font-normal text-sm text-[#B5C8DB]">@lebronjames</span>
                  <p className="font-['Inter'] font-normal text-sm text-white/90 max-w-xl mt-1 leading-relaxed">
                    Passionate reader and book enthusiast | Exploring worlds through words 📚✨
                  </p>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#D0D0D0] mt-2">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-[#3E8AFB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      lebronjames@example.com
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-[#3E8AFB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      +1 (555) 349-2049
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-[#3E8AFB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Los Angeles, CA
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Action Buttons (Suspend User) */}
              <div className="flex items-center gap-3 pb-2 shrink-0">
                <button
                  onClick={handleSuspendToggle}
                  className={`h-11 px-4 rounded-lg flex items-center gap-2.5 transition-all cursor-pointer font-['Inter'] text-sm font-medium border ${isSuspended
                      ? "bg-emerald-600/30 border-emerald-500/50 text-emerald-200 hover:bg-emerald-600/40"
                      : "bg-white/20 hover:bg-white/30 border-white/10 text-white shadow-md active:scale-95"
                    }`}
                  title={isSuspended ? "Re-activate user access" : "Suspend user access"}
                >
                  <SuspendUserIcon className="w-5 h-5 shrink-0" />
                  <span>{isSuspended ? "Unsuspend User" : "Suspend User"}</span>
                </button>
              </div>
            </div>
          </section>

          {/* =========================================================
              4 STAT CARDS (Frame 2147227571 / Frame 2147227572)
          ========================================================= */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Member Since */}
            <div className="h-[112px] rounded-xl p-[20px_16px] flex items-center bg-[#2B2A7D] bg-gradient-to-r from-[rgba(43,127,255,0.2)] to-[rgba(79,57,246,0.2)] shadow-[6px_6px_54px_rgba(0,0,0,0.05)] border border-white/10 hover:border-white/20 transition-all">
              <div className="flex flex-col justify-center w-full gap-2">
                {/* Frame 2147227571 (Top Row: Amount + Icon) */}
                <div className="flex items-center justify-between w-full">
                  <span className="font-['Lato'] font-medium text-2xl text-white tracking-tight leading-[140%]">
                    24 Aug 2024
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-[rgba(255,239,223,0.3)] flex items-center justify-center shrink-0">
                    <StatCalendarIcon className="w-5 h-5 text-white" />
                  </div>
                </div>
                {/* Category (Bottom) */}
                <span className="font-['Lato'] font-medium text-base text-white leading-[150%]">
                  Member Since
                </span>
              </div>
            </div>

            {/* Card 2: Channels Following (Replaced Total Played per user request) */}
            <div className="h-[112px] rounded-xl p-[20px_16px] flex items-center bg-[#2B2A7D] bg-gradient-to-r from-[rgba(43,127,255,0.2)] to-[rgba(79,57,246,0.2)] shadow-[6px_6px_54px_rgba(0,0,0,0.05)] border border-white/10 hover:border-white/20 transition-all">
              <div className="flex flex-col justify-center w-full gap-2">
                {/* Frame 2147227571 (Top Row: Amount 220 + ph:video Icon) */}
                <div className="flex items-center justify-between w-full">
                  <span className="font-['Lato'] font-medium text-2xl text-white tracking-tight leading-[140%]">
                    220
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-[rgba(255,239,223,0.3)] flex items-center justify-center shrink-0">
                    <ChannelsFollowingVideoIcon className="w-5 h-5 text-white" />
                  </div>
                </div>
                {/* Category (Bottom: Channels Following) */}
                <span className="font-['Lato'] font-medium text-base text-white leading-[150%]">
                  Channels Following
                </span>
              </div>
            </div>

            {/* Card 3: Audio Played */}
            <div className="h-[112px] rounded-xl p-[20px_16px] flex items-center bg-[#2B2A7D] bg-gradient-to-r from-[rgba(43,127,255,0.2)] to-[rgba(79,57,246,0.2)] shadow-[6px_6px_54px_rgba(0,0,0,0.05)] border border-white/10 hover:border-white/20 transition-all">
              <div className="flex flex-col justify-center w-full gap-2">
                {/* Frame 2147227571 (Top Row: Amount + Icon) */}
                <div className="flex items-center justify-between w-full">
                  <span className="font-['Lato'] font-medium text-2xl text-white tracking-tight leading-[140%]">
                    2,134 / 41
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-[rgba(255,239,223,0.3)] flex items-center justify-center shrink-0">
                    <StatPlaylistIcon className="w-5 h-5 text-white" />
                  </div>
                </div>
                {/* Category (Bottom) */}
                <span className="font-['Lato'] font-medium text-base text-white leading-[150%]">
                  Audio Played
                </span>
              </div>
            </div>

            {/* Card 4: Subscription Plan */}
            <div className="h-[112px] rounded-xl p-[20px_16px] flex items-center bg-[#2B2A7D] bg-gradient-to-r from-[rgba(43,127,255,0.2)] to-[rgba(79,57,246,0.2)] shadow-[6px_6px_54px_rgba(0,0,0,0.05)] border border-white/10 hover:border-white/20 transition-all">
              <div className="flex flex-col justify-center w-full gap-2">
                {/* Frame 2147227571 (Top Row: Amount + Icon) */}
                <div className="flex items-center justify-between w-full">
                  <span className="font-['Lato'] font-medium text-xl xl:text-2xl text-white tracking-tight leading-[140%] truncate">
                    Pro (Monthly)
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-[rgba(255,239,223,0.3)] flex items-center justify-center shrink-0">
                    <StatPackageIcon className="w-5 h-5 text-white" />
                  </div>
                </div>
                {/* Category (Bottom) */}
                <span className="font-['Lato'] font-medium text-base text-white leading-[150%]">
                  Subscription Plan
                </span>
              </div>
            </div>
          </section>

          {/* =========================================================
              LOWER SECTION (Frame 2147240236: 1152px x 640px)
              Left: Subscription Purchase History (718px x 640px)
              Right: Recent Activity (410px x 640px)
          ========================================================= */}
          <section className="flex flex-col xl:flex-row gap-6 items-start w-full max-w-[1152px]">
            {/* -------------------------------------------------------
                LEFT: Frame 2147240222 - Subscription Purchase History
                Width: 718px, Height: 640px, Gap: 16px
            ------------------------------------------------------- */}
            <div className="w-full xl:w-[718px] shrink-0 flex flex-col gap-4">
              {/* Frame 2147240220: Header */}
              <div className="w-full h-[34px] flex items-center">
                <h2 className="font-['Lato'] font-medium text-[24px] leading-[140%] tracking-[-0.02em] text-white">
                  Subscription Purchase History
                </h2>
              </div>

              {/* Table Wrapper with horizontal overflow protection on small devices */}
              <div className="w-full overflow-x-auto pb-2 xl:pb-0">
                {/* Frame 2147239933: Table Container (718px x 528px, rounded 16px) */}
                <div
                  className="w-[718px] min-h-[528px] rounded-[16px] overflow-hidden flex flex-col shrink-0 shadow-2xl border border-white/10"
                  style={{
                    background:
                      "linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(0deg, #2B2A7D, #2B2A7D), linear-gradient(90deg, rgba(43, 127, 255, 0.2) 0%, rgba(79, 57, 246, 0.2) 100%)",
                  }}
                >
                  {/* Frame 2147239437: Table Header (718px x 52px, rgba(43,127,255,0.3)) */}
                  <div className="w-[718px] h-[52px] px-4 flex items-center justify-between bg-[rgba(43,127,255,0.3)] rounded-t-[16px] shrink-0 border-b border-white/10">
                    {/* Col 1: Frame 2147239433 (width: 180px) */}
                    <div className="w-[180px] shrink-0 text-center font-['Lato'] font-medium text-[16px] leading-[150%] uppercase text-white">
                      PAYMENT DATES
                    </div>
                    {/* Col 2: Frame 2147239436 (width: 137px) */}
                    <div className="w-[137px] shrink-0 text-left font-['Lato'] font-medium text-[16px] leading-[150%] uppercase text-white">
                      CARD NUMBER
                    </div>
                    {/* Col 3: Cell-Name (width: 156px) */}
                    <div className="w-[156px] shrink-0 text-center font-['Lato'] font-medium text-[16px] leading-[150%] uppercase text-white">
                      SUBSCRIPTION TYPE
                    </div>
                    {/* Col 4: Cell-Name (width: 137px) */}
                    <div className="w-[137px] shrink-0 text-left font-['Lato'] font-medium text-[16px] leading-[150%] uppercase text-white">
                      AMOUNT
                    </div>
                  </div>

                  {/* 7 Table Rows (68px each, Frame 2147239439 - Frame 2147239445) */}
                  <div className="flex flex-col w-[718px]">
                    {PURCHASE_HISTORY.map((item, idx) => {
                      const isEvenRow = idx % 2 === 0;
                      const isLastRow = idx === PURCHASE_HISTORY.length - 1;

                      return (
                        <div
                          key={item.id}
                          className={`group relative w-[718px] h-[68px] px-4 flex items-center justify-between shrink-0 transition-all duration-200 cursor-pointer ${
                            isLastRow ? "rounded-b-[16px]" : ""
                          } hover:brightness-110 hover:shadow-[inset_0_0_24px_rgba(43,127,255,0.25)] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-gradient-to-b before:from-[#2B7FFF] before:to-[#4F39F6] before:opacity-0 hover:before:opacity-100 before:transition-opacity`}
                          style={{
                            background: isEvenRow
                              ? "linear-gradient(0deg, #2B2A7D, #2B2A7D), linear-gradient(90deg, rgba(43, 127, 255, 0.2) 0%, rgba(79, 57, 246, 0.2) 100%)"
                              : "linear-gradient(0deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05)), linear-gradient(0deg, #2B2A7D, #2B2A7D), linear-gradient(90deg, rgba(43, 127, 255, 0.2) 0%, rgba(79, 57, 246, 0.2) 100%)",
                          }}
                        >
                          {/* Col 1: Frame 2147239433 (width: 180px) */}
                          <div className="w-[180px] shrink-0 text-center font-['Lato'] font-normal text-[16px] leading-[150%] tracking-[-0.02em] text-[#DCE6F2] group-hover:text-white transition-colors">
                            {item.paymentDate}
                          </div>

                          {/* Col 2: Frame 2147239436 (width: 137px) */}
                          <div className="w-[137px] shrink-0 text-left font-['Lato'] font-normal text-[16px] leading-[150%] tracking-[-0.02em] text-[#DCE6F2] group-hover:text-white group-hover:font-medium transition-colors">
                            {item.cardNumber}
                          </div>

                          {/* Col 3: Cell-Name (width: 156px) -> Component 5/secondary button */}
                          <div className="w-[156px] shrink-0 flex items-center justify-center">
                            <div className="w-[118px] h-[30px] rounded-[4px] bg-[rgba(255,255,255,0.2)] px-3 py-1 flex items-center justify-center shadow-sm group-hover:bg-[rgba(255,255,255,0.32)] group-hover:scale-105 group-hover:shadow-md transition-all duration-200">
                              <span className="font-['Lato'] font-semibold text-[12px] leading-[140%] text-white whitespace-nowrap">
                                {item.subscriptionType}
                              </span>
                            </div>
                          </div>

                          {/* Col 4: Cell-Name (width: 137px) */}
                          <div className="w-[137px] shrink-0 text-left font-['Lato'] font-normal text-[16px] leading-[150%] tracking-[-0.02em] text-white group-hover:text-[#8BC5FF] group-hover:font-medium transition-colors">
                            {item.amount}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pagination Footer (718px x 40px, Section Result + Pagination) */}
                <div className="w-[718px] h-[40px] flex items-center justify-between mt-4">
                  {/* Section Result (width: 203px, height: 40px, gap: 10px) */}
                  <div className="flex items-center gap-2.5 h-[40px]">
                    {/* Text: Showing */}
                    <span className="font-['Lato'] font-medium text-[14px] leading-[150%] text-white">
                      Showing
                    </span>

                    {/* Button: 53px x 40px, rounded 6px, bg rgba(255,255,255,0.2) */}
                    <div className="relative">
                      <button
                        onClick={() => setRowsPerPage(rowsPerPage === 7 ? 10 : 7)}
                        className="w-[53px] h-[40px] px-2 rounded-[6px] bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.28)] flex items-center justify-center gap-1.5 text-white transition-all cursor-pointer"
                        title="Change rows per page"
                      >
                        <CaretDownIcon className="w-3.5 h-3.5 text-[#B5C8DB] shrink-0" />
                        <span className="font-['Lato'] font-normal text-[14px] leading-[150%] text-center text-white">
                          {rowsPerPage}
                        </span>
                      </button>
                    </div>

                    {/* Text: Out of 145 */}
                    <span className="font-['Lato'] font-medium text-[14px] leading-[150%] text-white">
                      Out of 145
                    </span>
                  </div>

                  {/* Pagination Controls (width: 358px, height: 40px, gap: 8px) */}
                  <div className="flex items-center gap-2 h-[40px]">
                    {/* Prev Button (92px x 40px) */}
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-[92px] h-[40px] px-2 rounded-[6px] bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.28)] disabled:opacity-40 flex items-center justify-center gap-1.5 transition-all cursor-pointer text-white"
                    >
                      <CaretLeftIcon className="w-3.5 h-3.5 text-[#B5C8DB] shrink-0" />
                      <span className="font-['Lato'] font-medium text-[14px] leading-[150%] text-center text-white">
                        Prev
                      </span>
                    </button>

                    {/* Page 1 (Active Gradient: #2B7FFF to #4F39F6) */}
                    <button
                      onClick={() => setCurrentPage(1)}
                      className={`w-[30px] h-[40px] rounded-[6px] flex items-center justify-center font-['Lato'] font-medium text-[14px] leading-[150%] text-center text-white transition-all cursor-pointer ${
                        currentPage === 1
                          ? "bg-gradient-to-r from-[#2B7FFF] to-[#4F39F6] shadow-md"
                          : "bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.28)]"
                      }`}
                    >
                      1
                    </button>

                    {/* Page 2 */}
                    <button
                      onClick={() => setCurrentPage(2)}
                      className={`w-[30px] h-[40px] rounded-[6px] flex items-center justify-center font-['Lato'] font-medium text-[14px] leading-[150%] text-center text-white transition-all cursor-pointer ${
                        currentPage === 2
                          ? "bg-gradient-to-r from-[#2B7FFF] to-[#4F39F6] shadow-md"
                          : "bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.28)]"
                      }`}
                    >
                      2
                    </button>

                    {/* Page 3 */}
                    <button
                      onClick={() => setCurrentPage(3)}
                      className={`w-[30px] h-[40px] rounded-[6px] flex items-center justify-center font-['Lato'] font-medium text-[14px] leading-[150%] text-center text-white transition-all cursor-pointer ${
                        currentPage === 3
                          ? "bg-gradient-to-r from-[#2B7FFF] to-[#4F39F6] shadow-md"
                          : "bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.28)]"
                      }`}
                    >
                      3
                    </button>

                    {/* Ellipsis (...) */}
                    <div className="w-[30px] h-[39px] rounded-[12px] flex items-center justify-center font-['Lato'] font-normal text-[14px] leading-[160%] text-center text-white select-none">
                      ...
                    </div>

                    {/* Page 15 */}
                    <button
                      onClick={() => setCurrentPage(15)}
                      className={`w-[30px] h-[40px] rounded-[6px] flex items-center justify-center font-['Lato'] font-medium text-[14px] leading-[150%] text-center text-white transition-all cursor-pointer ${
                        currentPage === 15
                          ? "bg-gradient-to-r from-[#2B7FFF] to-[#4F39F6] shadow-md"
                          : "bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.28)]"
                      }`}
                    >
                      15
                    </button>

                    {/* Next Button (68px x 40px) */}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(15, p + 1))}
                      disabled={currentPage === 15}
                      className="w-[68px] h-[40px] px-2 rounded-[6px] bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.28)] disabled:opacity-40 flex items-center justify-center gap-1.5 transition-all cursor-pointer text-white"
                    >
                      <span className="font-['Lato'] font-medium text-[14px] leading-[150%] text-center text-white">
                        Next
                      </span>
                      <CaretRightIcon className="w-3.5 h-3.5 text-[#B5C8DB] shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* -------------------------------------------------------
                RIGHT: Recent Activity Widget (410px / 5 cols)
            ------------------------------------------------------- */}
            <div className="w-full xl:w-[410px] flex-1 flex flex-col gap-4">
              <h2 className="font-['Lato'] font-medium text-2xl text-white tracking-tight">
                Recent Activity
              </h2>

              <div className="w-full rounded-2xl p-5 border border-white/10 shadow-xl bg-[#2B2A7D] bg-gradient-to-r from-[rgba(43,127,255,0.2)] to-[rgba(79,57,246,0.2)] flex flex-col gap-4">
                <div className="divide-y divide-white/10">
                  {RECENT_ACTIVITIES.map((activity) => (
                    <div key={activity.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col gap-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-['Inter'] text-sm font-medium text-white/95 leading-snug">
                          {activity.title}
                        </span>
                        {activity.rating && (
                          <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold">
                            <YellowStarIcon className="w-3 h-3 text-[#FFB216]" />
                            <span>{activity.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#B5C8DB]">
                        <span>{activity.timestamp}</span>
                        <span>•</span>
                        <span className="capitalize">{activity.type}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-white/10">
                  <Link
                    href="/admin/dashboard/user-details/activity-audit"
                    className="w-full py-2.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer group"
                  >
                    <span>View Complete Activity Audit</span>
                    <svg className="w-3.5 h-3.5 text-[#B5C8DB] group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* =============================================================
          SUSPEND USER CONFIRMATION MODAL (Figma Desktop - 24)
          Backdrop: Rectangle 2386 (bg: rgba(0,0,0,0.71), blur 5px)
          Modal Box: Frame 2147228403 (400px x 246px, rounded 10px)
      ============================================================= */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[5px] animate-in fade-in duration-200 p-4">
          <div
            className="w-[400px] max-w-full rounded-[10px] p-[26px_30px] flex flex-col items-center gap-5 shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200"
            style={{
              background:
                "linear-gradient(0deg, #2B2A7D, #2B2A7D), linear-gradient(90deg, rgba(43, 127, 255, 0.2) 0%, rgba(79, 57, 246, 0.2) 100%)",
            }}
          >
            {/* Warning Icon Container (46px x 46px, rounded 50px, bg: rgba(255,255,255,0.2)) */}
            <div className="w-[46px] h-[46px] rounded-full bg-white/20 flex items-center justify-center text-white shrink-0 shadow-md">
              <ModalWarningAlertIcon className="w-6 h-6 text-white" />
            </div>

            {/* Content Box (Frame 2147225863: 340px x 128px) */}
            <div className="flex flex-col items-center gap-5 w-full">
              {/* Question Heading (340px x 68px, Lato 600, 24px, #FFFFFF) */}
              <h3 className="font-['Lato'] font-semibold text-[24px] leading-[140%] text-center text-white max-w-[340px]">
                Are you sure you want to suspend this user?
              </h3>

              {/* Action Buttons (Frame 2147225846: 340px x 40px, gap 16px) */}
              <div className="flex items-center justify-center gap-4 w-full">
                {/* Secondary Button / Suspend Action (162px x 40px, #FF4B4B) */}
                <button
                  onClick={() => {
                    setIsSuspended(true);
                    setShowSuspendModal(false);
                  }}
                  className="w-[162px] h-[40px] rounded-[8px] bg-[#FF4B4B] hover:bg-[#E03A3A] active:scale-95 text-white font-['Lato'] font-semibold text-[16px] leading-[150%] flex items-center justify-center shadow-lg transition-all cursor-pointer"
                >
                  Suspend
                </button>

                {/* Cancel Button (162px x 40px, bg: rgba(255,255,255,0.2)) */}
                <button
                  onClick={() => setShowSuspendModal(false)}
                  className="w-[162px] h-[40px] rounded-[8px] bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.28)] active:scale-95 text-white font-['Lato'] font-semibold text-[16px] leading-[150%] flex items-center justify-center transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
