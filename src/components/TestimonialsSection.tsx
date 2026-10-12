"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { feedbackApi } from "@/lib/api";

interface TestimonialItem {
  id?: string | number;
  name: string;
  role: string;
  avatar?: string;
  initials?: string;
  avatarGradient?: string;
  rating?: number;
  quote: string;
}

const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    name: "Alex Reed",
    role: "Product Manager @ TechFlow",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    initials: "AR",
    rating: 5,
    quote:
      "This platform completely changed how I consume YouTube content. I used to spend 15+ hours a week watching podcasts and tech talks. Now I listen to 5-minute audio briefings on my morning commute and never miss key insights.",
  },
  {
    name: "Marcus Vance",
    role: "Lead Software Architect",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    initials: "MV",
    rating: 5,
    quote:
      "The accuracy of the AI analysis is phenomenal. It pinpoints the exact technical details and code architectures discussed without any fluff or filler. Best productivity investment I've made all year.",
  },
  {
    name: "Sarah Chen",
    role: "Venture Capitalist & Researcher",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    initials: "SC",
    rating: 5,
    quote:
      "I monitor over 40 creator channels across AI, economics, and biotechnology. Curio's personalized feed and audio summaries save my team dozens of hours of manual synthesis every single week.",
  },
  {
    name: "David Kim",
    role: "Full-Stack Developer",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    initials: "DK",
    rating: 5,
    quote:
      "Listening to summaries while working out or cooking has transformed my downtime into high-leverage learning. The voices sound completely natural and enjoyable.",
  },
];

const AVATAR_GRADIENTS = [
  "from-[#3E8AFB] to-[#9369FD]",
  "from-[#7A3BED] to-[#A842D4]",
  "from-[#2563EB] to-[#36C1FB]",
  "from-[#9369FD] to-[#3E8AFB]",
];

function TestimonialAvatar({
  name,
  avatarUrl,
  initials,
  gradient,
}: {
  name: string;
  avatarUrl?: string;
  initials: string;
  gradient: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (avatarUrl && !hasError) {
    return (
      <div className="relative w-11 h-11 rounded-full overflow-hidden border border-white/30 shrink-0 bg-slate-800">
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
      className={`w-11 h-11 rounded-full bg-gradient-to-tr ${gradient} border border-white/30 shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-md`}
    >
      {initials}
    </div>
  );
}

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(DEFAULT_TESTIMONIALS);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function fetchFeaturedReviews() {
      try {
        const res = await feedbackApi.getFeatured();
        if (isMounted && res && res.length > 0) {
          const featuredMapped: TestimonialItem[] = res.map((r: any, idx: number) => ({
            id: r.id,
            name: r.user_name || "Curio Member",
            role: r.subtitle || r.briefing_title || "Verified Member",
            avatar: r.user_avatar || "",
            initials: (r.user_name || "U").slice(0, 2).toUpperCase(),
            avatarGradient: AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length],
            rating: typeof r.rating === "number" ? r.rating : 5,
            quote: r.thoughts || r.useful_feedback || "The accuracy of the AI analysis and audio quality is phenomenal.",
          }));

          // Put real featured reviews from database first, then fill with default testimonials if needed
          const combined = [...featuredMapped, ...DEFAULT_TESTIMONIALS];
          setTestimonials(combined);
        }
      } catch (err) {
        console.error("Failed to load featured reviews:", err);
      }
    }

    fetchFeaturedReviews();
    return () => {
      isMounted = false;
    };
  }, []);

  const total = testimonials.length;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  // Get up to 3 visible items starting from currentIndex
  const visibleItems: TestimonialItem[] = [];
  const displayCount = Math.min(total, 3);
  for (let i = 0; i < displayCount; i++) {
    visibleItems.push(testimonials[(currentIndex + i) % total]);
  }

  return (
    <section id="testimonials" className="relative w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-0 py-16 sm:py-24">
      {/* Top Banner: Hero Imagery & "Trusted by 200+ Individuals" */}
      <div className="relative rounded-[32px] sm:rounded-[48px] overflow-hidden bg-figma-card border border-white/20 p-6 sm:p-10 mb-12 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Photo: Server Room & High-Tech Engineers */}
          <div className="lg:col-span-4 relative h-60 sm:h-72 rounded-[28px] overflow-hidden border border-white/15 shadow-lg group">
            <Image
              src="/images/server_room.png"
              alt="Data Infrastructure Team"
              fill
              unoptimized
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/70 via-transparent to-transparent" />
          </div>

          {/* Center: Trusted By Headline */}
          <div className="lg:col-span-4 text-center py-4 flex flex-col items-center justify-center space-y-2">
            <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/80">
              <span>Trusted</span>
              <Star className="w-5 h-5 fill-[#FFB216] text-[#FFB216]" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              by <span className="text-[#3E8AFB]">200+</span> Individuals
            </h2>
            <p className="text-[#D0D0D0] text-sm sm:text-base max-w-xs mx-auto">
              Engineers, researchers, executives, and lifelong learners rely on Curio daily.
            </p>
          </div>

          {/* Right Photo: Happy Professional User with Headphones */}
          <div className="lg:col-span-4 relative h-60 sm:h-72 rounded-[28px] overflow-hidden border border-white/15 shadow-lg group">
            <Image
              src="/images/happy_user.png"
              alt="Satisfied Learner Listening with Headphones"
              fill
              unoptimized
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/70 via-transparent to-transparent" />
          </div>
        </div>
      </div>

      {/* Review Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleItems.map((item, idx) => {
          const starsCount = item.rating || 5;
          const initials = item.initials || (item.name ? item.name.slice(0, 2).toUpperCase() : "CU");
          const gradient = item.avatarGradient || AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];

          return (
            <div
              key={`${item.id || idx}-${idx}`}
              className="rounded-2xl bg-white/[0.12] backdrop-blur-xl border border-white/20 p-7 flex flex-col justify-between shadow-xl shadow-black/20 hover:border-white/40 transition-all duration-300 min-h-[318px]"
            >
              <div className="space-y-4">
                {/* Golden Stars */}
                <div className="flex items-center gap-1.5">
                  {[...Array(5)].map((_, starIdx) => (
                    <Star
                      key={starIdx}
                      className={`w-5 h-5 ${
                        starIdx < starsCount
                          ? "fill-[#FFB216] text-[#FFB216]"
                          : "fill-transparent text-gray-500"
                      }`}
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-white text-base sm:text-[17px] leading-[150%] font-normal italic">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              {/* Author details */}
              <div className="flex items-center gap-3.5 pt-6 border-t border-white/10 mt-6">
                <TestimonialAvatar
                  name={item.name}
                  avatarUrl={item.avatar}
                  initials={initials}
                  gradient={gradient}
                />
                <div className="overflow-hidden min-w-0">
                  <h4 className="text-white font-semibold text-base leading-tight truncate">
                    {item.name}
                  </h4>
                  <p className="text-[#D0D0D0] text-sm truncate">
                    {item.role}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Carousel Navigation Arrows */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <button
          onClick={handlePrev}
          aria-label="Previous testimonial"
          className="w-12 h-12 rounded-xl bg-figma-primary text-white flex items-center justify-center shadow-md shadow-blue-700/30 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={handleNext}
          aria-label="Next testimonial"
          className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 text-white flex items-center justify-center hover:bg-white/25 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}
