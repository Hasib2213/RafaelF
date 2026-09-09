"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Check, Star, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function PricingSection() {
  const [selectedPlan, setSelectedPlan] = useState<string>("Pro");

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      period: "/forever",
      description: "For casual learners getting started with AI video summaries.",
      isPopular: false,
      features: [
        "Up to 5 video summaries / week",
        "Standard length text recaps",
        "Follow up to 3 YouTube creators",
        "Web access only",
        "Community support",
      ],
      buttonText: "Apply Now",
      buttonHref: "#signup",
    },
    {
      id: "pro",
      name: "Pro",
      price: "$12",
      period: "/per month",
      description: "For professionals, students, and power learners needing unlimited speed.",
      isPopular: true,
      popularLabel: "Popular",
      features: [
        "Unlimited video summaries",
        "HD audio briefings with realistic AI voices",
        "Follow unlimited YouTube creators",
        "Personalized daily digest feed",
        "Download audio briefings offline",
        "Priority customer support",
      ],
      buttonText: "Apply for Pro",
      buttonHref: "#signup",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "$80",
      period: "/per year",
      description: "For teams and power researchers who need bulk monitoring and API access.",
      isPopular: false,
      features: [
        "Everything in Pro included",
        "Multi-seat team workspace (up to 10)",
        "Automated Slack & Notion integration",
        "API & Webhook export options",
        "Dedicated account manager",
      ],
      buttonText: "Apply for Enterprise",
      buttonHref: "#contact",
    },
  ];

  return (
    <section id="pricing" className="relative w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-0 py-16 sm:py-24">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#CB52FF]/20 blur-[200px] pointer-events-none rounded-full" />

      {/* Header */}
      <div className="relative z-10 text-center max-w-xl mx-auto mb-14 sm:mb-16">
        <span className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold tracking-wider uppercase bg-white/10 text-white/90 border border-white/20 mb-4">
          Transparent Pricing
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-[48px] font-bold text-white leading-[1.2] tracking-[-0.02em]">
          Pricing
        </h2>
        <p className="text-[#D0D0D0] text-base sm:text-lg mt-3">
          Choose the right plan to upgrade your media consumption and reclaim hours of your day.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.name;

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.name)}
              className={`relative rounded-[32px] bg-figma-card-overlay border p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl cursor-pointer select-none ${
                isSelected
                  ? "border-[#7A3BED] shadow-[0_0_45px_rgba(122,59,237,0.35)] -translate-y-2 lg:-translate-y-3"
                  : "border-white/20 hover:border-white/40 shadow-black/30 hover:-translate-y-1"
              }`}
            >
              <div>
                {/* Header with Title, Price, and Popular Badge */}
                <div className="flex items-start justify-between gap-4 pb-6 border-b border-white/20">
                  <div>
                    <h3 className="text-2xl font-semibold text-white">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
                        {plan.price}
                      </span>
                      <span className="text-[#D0D0D0] text-base font-normal">
                        {plan.period}
                      </span>
                    </div>
                  </div>

                  {plan.isPopular && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-figma-primary text-white text-xs font-semibold shadow-md shadow-blue-600/30">
                      <Star className="w-3.5 h-3.5 fill-white" />
                      <span>{plan.popularLabel}</span>
                    </div>
                  )}
                </div>

                {/* Feature List */}
                <div className="py-6 space-y-4">
                  <p className="text-xs font-bold text-[#D0D0D0] uppercase tracking-wider">
                    Includes:
                  </p>
                  <ul className="space-y-3.5">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-3">
                        {/* Signature Figma checkmark */}
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-colors ${
                            isSelected
                              ? "bg-white"
                              : "bg-white/80"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 text-[#2563EB] stroke-[3]" />
                        </div>
                        <span className="text-white text-base leading-snug font-normal">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom Dynamic Interactive CTA Button */}
              <div className="pt-6 mt-auto">
                <Link
                  href={plan.buttonHref}
                  onClick={(e) => {
                    setSelectedPlan(plan.name);
                  }}
                  className={`relative overflow-hidden w-full py-3.5 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] ${
                    isSelected
                      ? "bg-figma-primary text-white shadow-lg shadow-blue-700/40 hover:opacity-95"
                      : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  }`}
                >
                  <span className="relative z-10">{plan.buttonText}</span>
                  <ArrowRight className="relative z-10 w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
