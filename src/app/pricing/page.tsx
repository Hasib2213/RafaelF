"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import FeedSidebar from "@/components/feed/FeedSidebar";
import FeedNavbar from "@/components/feed/FeedNavbar";
import Footer from "@/components/Footer";
import InAppPricingCard, { PlanConfig } from "@/components/pricing/InAppPricingCard";
import { subscriptionsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const defaultPlans: PlanConfig[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/forever",
    badgeText: "Basic",
    isPopular: false,
    features: [
      "Up to 5 video summaries / week",
      "Standard length text recaps",
      "Follow up to 3 YouTube creators",
      "Web access only",
      "Community support",
    ],
    buttonText: "Apply Now",
    buttonHref: "/checkout?plan=free",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$12",
    period: "/per month",
    isPopular: true,
    isHighlighted: true,
    features: [
      "Unlimited video summaries",
      "HD audio briefings with realistic AI voices",
      "Follow unlimited YouTube creators",
      "Personalized daily digest feed",
      "Download audio briefings offline",
    ],
    buttonText: "Apply for Pro",
    buttonHref: "/checkout?plan=pro",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$80",
    period: "/per year",
    isPopular: false,
    features: [
      "Everything in Pro included",
      "Multi-seat team workspace (up to 10)",
      "Automated Slack & Notion integration",
      "API & Webhook export options",
      "Dedicated account manager",
    ],
    buttonText: "Apply for Enterprise",
    buttonHref: "/checkout?plan=enterprise",
  },
];

export default function InAppPricingPage() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [plans, setPlans] = useState<PlanConfig[]>(defaultPlans);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("pro");
  const [hoveredPlanId, setHoveredPlanId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Always refresh freshest user profile when visiting Pricing page
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Set selected plan based on current user's active tier
  useEffect(() => {
    if (user?.plan) {
      const planKey = user.plan.toLowerCase();
      setSelectedPlanId(planKey);
    }
  }, [user?.plan]);

  useEffect(() => {
    let isMounted = true;
    async function loadPlans() {
      try {
        const fetched = await subscriptionsApi.getPlans();
        if (isMounted && Array.isArray(fetched) && fetched.length > 0) {
          const userPlanName = user?.plan?.toLowerCase();
          const mapped: PlanConfig[] = fetched.map((p: any) => {
            const rawPrice = parseFloat(p.price || "0");
            const priceFormatted = rawPrice % 1 === 0 ? `$${rawPrice.toFixed(0)}` : `$${rawPrice.toFixed(2)}`;
            const rawFeatures = Array.isArray(p.features)
              ? p.features
              : typeof p.features === "string"
              ? p.features.split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean)
              : [];
            const planSlug = (p.slug || p.name || "").toLowerCase();
            const isCurrentPlan = userPlanName === planSlug;
            return {
              id: p.slug || p.id,
              name: p.name,
              price: priceFormatted,
              period: p.period || (p.billing_cycle === "yearly" ? "/per year" : "/per month"),
              badgeText: isCurrentPlan ? "Active Plan" : (p.badge_text || undefined),
              isPopular: !isCurrentPlan && !!p.is_popular,
              isHighlighted: isCurrentPlan || !!p.is_best_offer,
              features: rawFeatures,
              buttonText: isCurrentPlan ? "Current Plan" : (p.slug === "free" ? "Apply Now" : `Apply for ${p.name}`),
              buttonHref: isCurrentPlan ? undefined : `/checkout?plan=${p.slug || p.id}&plan_id=${p.id}`,
            };
          });
          setPlans(mapped);
        }
      } catch (err) {
        // Fallback to defaultPlans
      }
    }
    loadPlans();
    return () => {
      isMounted = false;
    };
  }, [user?.plan]);

  const activePlanId = hoveredPlanId || selectedPlanId;

  const pricingSection = (
    <div className="w-full flex flex-col gap-8 items-center">
      {/* Header */}
      <section className="w-full flex flex-col items-center text-center gap-2 py-2">
        <h1 className="text-[28px] sm:text-[34px] font-semibold text-white leading-[135%] tracking-[-0.02em] font-['Lato',sans-serif]">
          Pricing
        </h1>
        <p className="max-w-[560px] text-base font-normal text-white/90 leading-[150%] tracking-[-0.02em] font-['Lato',sans-serif]">
          Simple, transparent pricing designed to fit your needs. Choose a plan and start transforming videos into smart insights instantly.
        </p>
      </section>

      {/* Pricing Cards Grid */}
      <section className="w-full flex flex-row flex-wrap lg:flex-nowrap justify-center items-center gap-5">
        {plans.map((plan) => (
          <InAppPricingCard
            key={plan.id}
            plan={plan}
            isSelected={selectedPlanId === plan.id}
            isHovered={activePlanId === plan.id}
            onSelect={() => setSelectedPlanId(plan.id)}
            onMouseEnter={() => setHoveredPlanId(plan.id)}
            onMouseLeave={() => setHoveredPlanId(null)}
          />
        ))}
      </section>
    </div>
  );

  // If user is not logged in (e.g. visited /pricing directly from public landing page):
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
          <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 py-12 flex flex-col items-center justify-center">
            {pricingSection}
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
      {/* Left Sidebar (Figma Desktop - 49 Side Panel: 240px wide) */}
      <FeedSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Right Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Nav (Figma Desktop - 49 Nav: 80px height) */}
        <FeedNavbar
          showSearch={false}
          userSubtitle={user?.email || ""}
          onMobileMenuToggle={() => setMobileSidebarOpen((prev) => !prev)}
        />

        {/* Main Content Container */}
        <main className="flex-1 w-full max-w-[1152px] mx-auto px-6 py-8 flex flex-col gap-8">
          {pricingSection}
        </main>

        {/* Desktop - 49 Footer */}
        <div className="w-full mt-16">
          <Footer />
        </div>
      </div>
    </div>
  );
}
