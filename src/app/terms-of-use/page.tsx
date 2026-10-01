"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import FeedSidebar from "@/components/feed/FeedSidebar";
import FeedNavbar from "@/components/feed/FeedNavbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { settingsApi } from "@/lib/api";

export default function TermsOfUsePage() {
  const { user, isAuthenticated } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [customTerms, setCustomTerms] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadTerms() {
      try {
        const s = await settingsApi.getSettings();
        if (isMounted && s?.terms_of_use) {
          setCustomTerms(s.terms_of_use);
        }
      } catch {
        // Fallback default
      }
    }
    loadTerms();
    return () => {
      isMounted = false;
    };
  }, []);

  const termsContent = (
    <div className="w-full rounded-2xl p-6 sm:p-9 border border-white/20 shadow-[0px_1px_12px_rgba(0,0,0,0.05)] bg-[#2B2A7D] [background-image:linear-gradient(90deg,rgba(43,127,255,0.2)_0%,rgba(79,57,246,0.2)_100%)] flex flex-col gap-6">
      {/* Header: "Terms of Use" (Figma Frame 2147227774 / Frame 2147239908) */}
      <div className="w-full border-b border-white/10 pb-4">
        <h1 className="text-white text-2xl sm:text-[28px] font-semibold font-['Lato',sans-serif] leading-[135%] tracking-[-0.02em]">
          Terms of Use
        </h1>
      </div>

      {/* Terms Content Body (Figma Frame 2147228289 / Frame 2147224985: Font: Inter 16px, line-height 150%) */}
      <div className="flex flex-col gap-6 font-['Inter',sans-serif] text-base text-white/95 leading-[150%] tracking-[-0.02em]">
        {customTerms ? (
          <div className="whitespace-pre-line leading-relaxed text-white/90">
            {customTerms}
          </div>
        ) : (
          <>
            <p>
              Welcome to Curio. These Terms of Use (&quot;Terms&quot;) govern your access to and use of our website, applications, audio synthesis tools, and artificial intelligence briefing services (collectively, the &quot;Service&quot;). By creating an account, accessing, or using Curio, you signify your agreement to be bound by these Terms and our Privacy Policy. If you do not agree with any part of these Terms, you must discontinue your use of our Service immediately.
            </p>

            <p>
              Curio provides automated, AI-generated analytical summaries and synthesized audio briefings derived from publicly available digital video content. All content is processed for informational, educational, and accessibility enhancement purposes. We do not claim ownership of any third-party video, audio, or intellectual property from which summaries are generated; all original media copyrights remain exclusively with their respective creators and copyright holders.
            </p>

            <div className="flex flex-col gap-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white font-['Lato',sans-serif] tracking-normal">
                1. Permitted Use and User Responsibilities
              </h2>
              <p>
                You agree to use Curio solely for lawful personal or internal productivity purposes. You may not reverse-engineer, scrape, bulk-extract, or redistribute Curio&apos;s synthesized audio assets, algorithms, or API endpoints without prior express written authorization. You are solely responsible for safeguarding the credentials associated with your account and for all activities conducted thereunder.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white font-['Lato',sans-serif] tracking-normal">
                2. Subscriptions, Billing, and Cancellations
              </h2>
              <p>
                Certain premium tiers and features require an active paid subscription. Subscription fees are billed on a recurring monthly or annual basis, as selected at checkout. You may cancel your subscription at any time through your Profile dashboard; cancellation will take effect at the conclusion of your current billing cycle. All payments processed are non-refundable except where mandated by applicable consumer protection laws.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white font-['Lato',sans-serif] tracking-normal">
                3. Service Availability and Limitation of Liability
              </h2>
              <p>
                While Curio strives to maintain uninterrupted availability and maximum summarization accuracy, the Service is delivered on an &quot;as is&quot; and &quot;as available&quot; basis. In no event shall Curio, its directors, employees, or partners be liable for any indirect, consequential, incidental, or punitive damages resulting from your use or inability to use the service, third-party platform API interruptions, or inaccuracies in algorithmic transcriptions.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white font-['Lato',sans-serif] tracking-normal">
                4. Amendments to Terms
              </h2>
              <p>
                We reserve the right to revise or replace these Terms at our discretion. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the updated terms.
              </p>
            </div>

            <p className="text-sm text-[#D0D0D0] pt-4 border-t border-white/10">
              Last updated: January 2026. For questions or legal inquiries regarding these Terms of Use, please reach out via our{" "}
              <a href="/contact-us" className="text-cyan-300 underline hover:text-white transition-colors">
                Contact Us
              </a>{" "}
              page or email us directly at info@curio.com.
            </p>
          </>
        )}
      </div>
    </div>
  );

  // If user is not logged in (e.g. clicked Terms of Use from landing page footer):
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
            {termsContent}
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
      {/* Left Sidebar (Figma Desktop - 8: Side Panel - 240px x 806px) */}
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
          {termsContent}
        </main>

        {/* Bottom Footer (Figma Desktop - 8: 1440px x 501px) */}
        <div className="w-full mt-16">
          <Footer />
        </div>
      </div>
    </div>
  );
}
