"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import FeedSidebar from "@/components/feed/FeedSidebar";
import FeedNavbar from "@/components/feed/FeedNavbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { settingsApi } from "@/lib/api";

export default function PrivacyPolicyPage() {
  const { user, isAuthenticated } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [customPolicy, setCustomPolicy] = useState<string | null>(null);
  const [contactEmail, setContactEmail] = useState("support@curio.com");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadPolicy() {
      setIsLoading(true);
      try {
        const s = await settingsApi.getSettings();
        if (isMounted) {
          if (s?.privacy_policy) setCustomPolicy(s.privacy_policy);
          if (s?.email) setContactEmail(s.email);
        }
      } catch {
        // Fallback default
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadPolicy();
    return () => {
      isMounted = false;
    };
  }, []);

  const policyContent = (
    <div className="w-full rounded-2xl p-6 sm:p-9 border border-white/20 shadow-[0px_1px_12px_rgba(0,0,0,0.05)] bg-[#2B2A7D] [background-image:linear-gradient(90deg,rgba(43,127,255,0.2)_0%,rgba(79,57,246,0.2)_100%)] flex flex-col gap-6">
      {/* Header: "Privacy Policy" (Figma Frame 2147227774 / Frame 2147239908) */}
      <div className="w-full border-b border-white/10 pb-4">
        <h1 className="text-white text-2xl sm:text-[28px] font-semibold font-['Lato',sans-serif] leading-[135%] tracking-[-0.02em]">
          Privacy Policy
        </h1>
      </div>

      {/* Privacy Policy Content Body (Figma Frame 2147228289 / Frame 2147224985: Inter 16px, line-height 150%) */}
      <div className="flex flex-col gap-6 font-['Inter',sans-serif] text-base text-white/95 leading-[150%] tracking-[-0.02em]">
        {isLoading ? (
          <div className="flex flex-col gap-4 animate-pulse py-2">
            <div className="h-5 bg-white/10 rounded w-3/4" />
            <div className="h-4 bg-white/10 rounded w-full" />
            <div className="h-4 bg-white/10 rounded w-5/6" />
            <div className="h-4 bg-white/10 rounded w-full" />
            <div className="h-6 bg-white/15 rounded w-1/3 mt-4" />
            <div className="h-4 bg-white/10 rounded w-full" />
            <div className="h-4 bg-white/10 rounded w-4/5" />
            <div className="h-6 bg-white/15 rounded w-1/3 mt-4" />
            <div className="h-4 bg-white/10 rounded w-full" />
            <div className="h-4 bg-white/10 rounded w-3/4" />
          </div>
        ) : customPolicy ? (
          <div className="whitespace-pre-line leading-relaxed text-white/90">
            {customPolicy}
          </div>
        ) : (
          <p className="text-[#D0D0D0]">No Privacy Policy content available.</p>
        )}

        <p className="text-sm text-[#D0D0D0] pt-4 border-t border-white/10">
          Last updated: January 2026. If you have additional questions or require more information about our Privacy Policy, please contact us at {contactEmail} or submit a request via our{" "}
          <a href="/contact-us" className="text-cyan-300 underline hover:text-white transition-colors">
            Contact Us
          </a>{" "}
          page.
        </p>
      </div>
    </div>
  );

  // If user is not logged in (e.g. clicked Privacy Policy from landing page footer):
  // Render with public Navbar and Footer, without the internal feed sidebar
  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen bg-[#0F172A] text-white font-['Lato',sans-serif] flex flex-col justify-between overflow-hidden">
        {/* Figma Ambient Glow Orbs */}
        <div
          className="absolute -left-64 -top-64 w-[592px] h-[693px] rounded-full bg-[#CB52FF]/20 blur-[180px] pointer-events-none z-0"
          aria-hidden="true"
        />
        <div
          className="absolute -right-48 top-[600px] w-[528px] h-[618px] rounded-full bg-[#3E8AFB]/15 blur-[180px] pointer-events-none z-0"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col flex-1 justify-between min-h-screen">
          <Navbar />
          <main className="flex-1 w-full max-w-[1152px] mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col gap-10">
            {policyContent}
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  // Authenticated user (logged in, navigating from within app):
  // Render with FeedSidebar and FeedNavbar
  return (
    <div className="flex min-h-screen bg-[#0F172A] text-white font-['Lato',sans-serif]">
      {/* Left Sidebar (240px wide) */}
      <FeedSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#0F172A]">
        {/* Top Navbar */}
        <FeedNavbar
          showSearch={false}
          userSubtitle={user?.email || ""}
          onMobileMenuToggle={() => setMobileSidebarOpen((prev) => !prev)}
        />

        {/* Main Canvas Area */}
        <main className="flex-1 w-full max-w-[1152px] mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col gap-10">
          {policyContent}
        </main>

        {/* Bottom Footer */}
        <div className="w-full mt-16">
          <Footer />
        </div>
      </div>
    </div>
  );
}
