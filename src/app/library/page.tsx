"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import FeedSidebar from "@/components/feed/FeedSidebar";
import FeedNavbar from "@/components/feed/FeedNavbar";
import LibraryCard, { LibraryItem } from "@/components/library/LibraryCard";
import AudioPlayerModal from "@/components/feed/AudioPlayerModal";
import FeedbackModal from "@/components/feed/FeedbackModal";
import ImproveSummaryModal from "@/components/feed/ImproveSummaryModal";
import ThankYouModal from "@/components/feed/ThankYouModal";
import { BriefingItem } from "@/components/feed/BriefingCard";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  X,
  Check,
  RotateCcw,
} from "lucide-react";

type LibraryFilter = "recently" | "oldest" | "a-z" | "z-a";

import { libraryApi } from "@/lib/api";

function mapBackendLibraryItem(item: any): LibraryItem {
  const b = item.briefing || item;
  return {
    id: item.id || b.id, // item.id is the SavedItem UUID
    title: b.title || "Untitled Briefing",
    duration: b.duration || "10:00",
    thumbnail: b.thumbnail_url || "/images/summary.png",
    channelName: b.channel_name || "Creator",
    subscribers: b.subscribers || "1M subscribers",
    channelAvatar: b.channel_avatar_url || "/images/creators.png",
    summary: b.summary || "",
    fullSummary: b.full_summary || "",
    keyTakeaways: b.key_takeaways || [],
    savedAt: item.saved_at || item.created_at || b.created_at || new Date().toISOString(),
    category: b.category || "General",
  };
}

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removedItem, setRemovedItem] = useState<{ item: LibraryItem; index: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [filterActive, setFilterActive] = useState<LibraryFilter>("recently");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Audio Player & Feedback Modals
  const [selectedBriefing, setSelectedBriefing] = useState<BriefingItem | null>(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [activeFeedbackBriefing, setActiveFeedbackBriefing] = useState<BriefingItem | null>(null);
  const [improveModalOpen, setImproveModalOpen] = useState(false);
  const [activeImproveBriefing, setActiveImproveBriefing] = useState<BriefingItem | null>(null);
  const [thankYouModalOpen, setThankYouModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchLibrary = async () => {
      setIsLoading(true);
      try {
        const res = await libraryApi.list({
          sort: filterActive,
          search: searchQuery.trim() || undefined,
        });
        const list = Array.isArray(res) ? res : res?.results || [];
        if (isMounted) {
          setItems(list.map(mapBackendLibraryItem));
        }
      } catch (err) {
        console.error("Failed to fetch library items:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    fetchLibrary();
    return () => {
      isMounted = false;
    };
  }, [filterActive, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePlayAudio = (item: LibraryItem) => {
    const briefing: BriefingItem = {
      id: item.id,
      title: item.title,
      duration: item.duration,
      thumbnail: item.thumbnail,
      channelName: item.channelName,
      subscribers: item.subscribers,
      channelAvatarColor: "from-blue-600 to-indigo-700",
      channelInitials: item.channelName.slice(0, 2).toUpperCase(),
      summary: item.summary,
      fullSummary: item.fullSummary,
      keyTakeaways: item.keyTakeaways,
    };
    setSelectedBriefing(briefing);
  };

  const handleRemove = async (id: string) => {
    const idx = items.findIndex((i) => i.id === id);
    if (idx !== -1) {
      const removed = items[idx];
      setRemovedItem({ item: removed, index: idx });
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast(`Removed "${removed.title.slice(0, 35)}..." from Library.`);
      try {
        await libraryApi.remove(id);
      } catch (err) {
        console.error("Failed to delete item from backend:", err);
      }
    }
  };

  const handleUndoRemove = () => {
    if (removedItem) {
      setItems((prev) => {
        const next = [...prev];
        next.splice(removedItem.index, 0, removedItem.item);
        return next;
      });
      showToast(`Restored "${removedItem.item.title.slice(0, 35)}..." to Library.`);
      setRemovedItem(null);
    }
  };

  const handleSelectFilter = (filter: LibraryFilter) => {
    setFilterActive(filter);
    setFilterDropdownOpen(false);

    const sorted = [...items];
    if (filter === "recently") {
      sorted.sort((a, b) => (b.savedAt ? new Date(b.savedAt).getTime() : 0) - (a.savedAt ? new Date(a.savedAt).getTime() : 0));
    } else if (filter === "oldest") {
      sorted.sort((a, b) => (a.savedAt ? new Date(a.savedAt).getTime() : 0) - (b.savedAt ? new Date(b.savedAt).getTime() : 0));
    } else if (filter === "a-z") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (filter === "z-a") {
      sorted.sort((a, b) => b.title.localeCompare(a.title));
    }
    setItems(sorted);

    const labels: Record<LibraryFilter, string> = {
      recently: "Recently Saved",
      oldest: "Oldest Saved",
      "a-z": "A-Z",
      "z-a": "Z-A",
    };
    showToast(`Sorted by: ${labels[filter]}`);
  };

  const handleOpenFeedback = (briefing?: BriefingItem | null) => {
    const target = briefing || selectedBriefing;
    if (target) {
      setActiveFeedbackBriefing(target);
      setSelectedBriefing(null);
      setImproveModalOpen(false);
      setThankYouModalOpen(false);
      setFeedbackModalOpen(true);
    }
  };

  const handleOpenImprove = (briefing?: BriefingItem | null) => {
    const target = briefing || activeFeedbackBriefing || selectedBriefing;
    if (target) {
      setActiveImproveBriefing(target);
      setSelectedBriefing(null);
      setFeedbackModalOpen(false);
      setThankYouModalOpen(false);
      setImproveModalOpen(true);
    }
  };

  const handleOpenThankYou = () => {
    setSelectedBriefing(null);
    setFeedbackModalOpen(false);
    setImproveModalOpen(false);
    setThankYouModalOpen(true);
  };

  // Filter items by search query if present
  const filteredItems = searchQuery.trim()
    ? items.filter(
        (i) =>
          i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.channelName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  const displayedItems = filteredItems.slice(0, itemsPerPage);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-[#0F172A] text-white font-['Lato',sans-serif]">
      {/* Left Sidebar (Figma Side Panel: 240px x 806px, responsive drawer on mobile) */}
      <FeedSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Right Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Nav (Figma Desktop - 6 Nav: 80px, userSubtitle='abir07@gmai.com') */}
        <FeedNavbar
          showSearch={true}
          onSearch={(q) => setSearchQuery(q)}
          userSubtitle="abir07@gmai.com"
          onMobileMenuToggle={() => setMobileSidebarOpen((prev) => !prev)}
        />

        {/* Main Canvas Canvas (Figma Frame 2147239907: width 1152px, left 264px, top 104px) */}
        <main className="flex-1 w-full max-w-[1152px] mx-auto px-6 py-6 flex flex-col gap-6">
          {/* Header Row (Figma Frame 2147239910: 1152px x 66px, justify-between) */}
          <section className="w-full flex flex-row justify-between items-center py-2">
            {/* Title & Subtitle (Figma Frame 2147239908: 240px x 66px) */}
            <div className="flex flex-col gap-1">
              <h1 className="text-[28px] font-semibold text-white leading-[135%] tracking-[-0.02em] font-['Lato',sans-serif]">
                Library
              </h1>
              <p className="text-base font-normal text-[#D0D0D0] leading-[150%] tracking-[-0.02em] font-['Lato',sans-serif]">
                All your saved briefings in one place
              </p>
            </div>

            {/* Filter Button & Dropdown Menu (Figma Button CTA / Frame 2147239940: 81px x 40px) */}
            <div className="relative" ref={filterRef}>
              <button
                type="button"
                onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                className={`h-10 px-3.5 py-2 rounded-lg border flex items-center gap-2 text-white text-base font-medium font-['Lato',sans-serif] transition-all duration-200 cursor-pointer select-none backdrop-blur-md ${
                  filterDropdownOpen
                    ? "bg-white/25 border-[#36C1FB]/60 ring-2 ring-[#36C1FB]/30 shadow-[0_0_16px_rgba(54,193,251,0.25)] text-white"
                    : "bg-white/20 hover:bg-white/30 border-white/15 hover:border-white/30 shadow-sm"
                }`}
              >
                {/* mage:filter SVG vector (16px x 16px rotated) */}
                <SlidersHorizontal
                  className={`w-4 h-4 transition-colors ${
                    filterDropdownOpen ? "text-[#36C1FB]" : "text-[#B5C8DB]"
                  }`}
                />
                <span>Filter</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#B5C8DB] transition-transform duration-200 ${
                    filterDropdownOpen ? "rotate-180 text-[#36C1FB]" : ""
                  }`}
                />
              </button>

              {/* Glassmorphic Filter Dropdown Popover */}
              {filterDropdownOpen && (
                <div
                  id="library-filter-menu"
                  className="absolute right-0 top-[48px] w-[200px] p-1.5 z-40 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_25px_rgba(79,57,246,0.35)] backdrop-blur-2xl border border-white/25 [background:linear-gradient(145deg,rgba(26,23,68,0.96)_0%,rgba(43,42,125,0.96)_100%)] flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150"
                >
                  {/* Option 1: Recently Saved */}
                  <button
                    type="button"
                    onClick={() => handleSelectFilter("recently")}
                    className={`w-full h-10 px-3 rounded-xl flex items-center justify-between text-sm font-medium font-['Lato',sans-serif] leading-[150%] transition-all cursor-pointer select-none ${
                      filterActive === "recently"
                        ? "bg-gradient-to-r from-[#2563EB]/40 to-[#7A3BED]/40 text-[#36C1FB] font-semibold border border-[#36C1FB]/30 shadow-inner"
                        : "text-white/90 hover:text-white hover:bg-white/15"
                    }`}
                  >
                    <span>Recently Saved</span>
                    {filterActive === "recently" && (
                      <Check className="w-4 h-4 text-[#36C1FB] shrink-0" strokeWidth={2.5} />
                    )}
                  </button>

                  <div className="w-full h-0 border-t border-white/10 my-0.5" />

                  {/* Option 2: Oldest Saved */}
                  <button
                    type="button"
                    onClick={() => handleSelectFilter("oldest")}
                    className={`w-full h-10 px-3 rounded-xl flex items-center justify-between text-sm font-medium font-['Lato',sans-serif] leading-[150%] transition-all cursor-pointer select-none ${
                      filterActive === "oldest"
                        ? "bg-gradient-to-r from-[#2563EB]/40 to-[#7A3BED]/40 text-[#36C1FB] font-semibold border border-[#36C1FB]/30 shadow-inner"
                        : "text-white/90 hover:text-white hover:bg-white/15"
                    }`}
                  >
                    <span>Oldest Saved</span>
                    {filterActive === "oldest" && (
                      <Check className="w-4 h-4 text-[#36C1FB] shrink-0" strokeWidth={2.5} />
                    )}
                  </button>

                  <div className="w-full h-0 border-t border-white/10 my-0.5" />

                  {/* Option 3: A-Z */}
                  <button
                    type="button"
                    onClick={() => handleSelectFilter("a-z")}
                    className={`w-full h-10 px-3 rounded-xl flex items-center justify-between text-sm font-medium font-['Lato',sans-serif] leading-[150%] transition-all cursor-pointer select-none ${
                      filterActive === "a-z"
                        ? "bg-gradient-to-r from-[#2563EB]/40 to-[#7A3BED]/40 text-[#36C1FB] font-semibold border border-[#36C1FB]/30 shadow-inner"
                        : "text-white/90 hover:text-white hover:bg-white/15"
                    }`}
                  >
                    <span>A-Z</span>
                    {filterActive === "a-z" && (
                      <Check className="w-4 h-4 text-[#36C1FB] shrink-0" strokeWidth={2.5} />
                    )}
                  </button>

                  <div className="w-full h-0 border-t border-white/10 my-0.5" />

                  {/* Option 4: Z-A */}
                  <button
                    type="button"
                    onClick={() => handleSelectFilter("z-a")}
                    className={`w-full h-10 px-3 rounded-xl flex items-center justify-between text-sm font-medium font-['Lato',sans-serif] leading-[150%] transition-all cursor-pointer select-none ${
                      filterActive === "z-a"
                        ? "bg-gradient-to-r from-[#2563EB]/40 to-[#7A3BED]/40 text-[#36C1FB] font-semibold border border-[#36C1FB]/30 shadow-inner"
                        : "text-white/90 hover:text-white hover:bg-white/15"
                    }`}
                  >
                    <span>Z-A</span>
                    {filterActive === "z-a" && (
                      <Check className="w-4 h-4 text-[#36C1FB] shrink-0" strokeWidth={2.5} />
                    )}
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Saved Cards Grid (Figma Frame 2147239874: 1152px, 3 columns x 4 rows) */}
          {isLoading ? (
            <div className="w-full py-24 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-[#36C1FB] border-t-transparent rounded-full animate-spin" />
              <p className="text-white/70 text-sm font-['Lato',sans-serif]">Loading your saved briefings...</p>
            </div>
          ) : displayedItems.length > 0 ? (
            <section className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedItems.map((item) => (
                <LibraryCard
                  key={item.id}
                  item={item}
                  onPlayAudio={handlePlayAudio}
                  onRemove={handleRemove}
                />
              ))}
            </section>
          ) : (
            <div className="w-full py-20 rounded-2xl border border-white/10 [background:linear-gradient(0deg,#2B2A7D,#2B2A7D),linear-gradient(90deg,rgba(43,127,255,0.2)_0%,rgba(79,57,246,0.2)_100%)] flex flex-col items-center justify-center gap-4 text-center px-4">
              <h3 className="text-xl font-semibold text-white">No saved briefings found</h3>
              <p className="text-sm text-[#D0D0D0] max-w-md">
                {searchQuery
                  ? `No briefings match "${searchQuery}". Try a different keyword.`
                  : "Your library is currently empty. Bookmark briefings from your Feed to listen to them here anytime."}
              </p>
              {!searchQuery && (
                <Link
                  href="/feed"
                  className="mt-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7A3BED] text-white text-sm font-semibold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-purple-900/40"
                >
                  Explore Feed
                </Link>
              )}
              {removedItem && (
                <button
                  type="button"
                  onClick={handleUndoRemove}
                  className="mt-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium text-sm flex items-center gap-2 cursor-pointer transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restore Last Removed Item</span>
                </button>
              )}
            </div>
          )}

          {/* Pagination Footer (Figma Pagination Footer: 1128px x 40px) */}
          <footer className="w-full max-w-[1128px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 pb-12 border-t border-white/10">
            {/* Left Result Count */}
            <div className="flex items-center gap-2.5 text-white text-sm font-medium font-['Lato',sans-serif]">
              <span>Showing</span>
              <div className="h-10 px-2.5 rounded-md bg-white/20 border border-white/10 flex items-center gap-1 cursor-pointer hover:bg-white/25 transition-all">
                <span>{Math.min(itemsPerPage, filteredItems.length)}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#B5C8DB]" />
              </div>
              <span>of {filteredItems.length} items</span>
            </div>

            {/* Right Pagination Buttons (Previous, 1, 2, 3, ..., 10, Next) */}
            <div className="flex items-center gap-2 select-none">
              {/* Previous */}
              <button
                type="button"
                onClick={() => setActivePage(Math.max(1, activePage - 1))}
                className="h-10 px-3 rounded-md bg-white/20 hover:bg-white/30 border border-white/10 flex items-center gap-1 text-white text-sm font-medium font-['Lato',sans-serif] transition-all cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-[#B5C8DB]" />
                <span>Previous</span>
              </button>

              {/* Page 1 (Active) */}
              <button
                type="button"
                onClick={() => setActivePage(1)}
                className={`h-10 w-[30px] rounded-md flex items-center justify-center text-sm font-medium font-['Lato',sans-serif] transition-all cursor-pointer ${
                  activePage === 1
                    ? "bg-gradient-to-r from-[#2B7FFF] to-[#4F39F6] text-white shadow-md shadow-blue-900/50"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                1
              </button>

              {/* Page 2 */}
              <button
                type="button"
                onClick={() => setActivePage(2)}
                className={`h-10 w-[30px] rounded-md flex items-center justify-center text-sm font-medium font-['Lato',sans-serif] transition-all cursor-pointer ${
                  activePage === 2
                    ? "bg-gradient-to-r from-[#2B7FFF] to-[#4F39F6] text-white shadow-md"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                2
              </button>

              {/* Page 3 */}
              <button
                type="button"
                onClick={() => setActivePage(3)}
                className={`h-10 w-[30px] rounded-md flex items-center justify-center text-sm font-medium font-['Lato',sans-serif] transition-all cursor-pointer ${
                  activePage === 3
                    ? "bg-gradient-to-r from-[#2B7FFF] to-[#4F39F6] text-white shadow-md"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                3
              </button>

              {/* Ellipsis */}
              <div className="h-10 w-[30px] flex items-center justify-center text-white text-sm font-normal font-['Lato',sans-serif]">
                ...
              </div>

              {/* Page 10 */}
              <button
                type="button"
                onClick={() => setActivePage(10)}
                className={`h-10 w-[30px] rounded-md flex items-center justify-center text-sm font-medium font-['Lato',sans-serif] transition-all cursor-pointer ${
                  activePage === 10
                    ? "bg-gradient-to-r from-[#2B7FFF] to-[#4F39F6] text-white shadow-md"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                10
              </button>

              {/* Next */}
              <button
                type="button"
                onClick={() => setActivePage(Math.min(10, activePage + 1))}
                className="h-10 px-3 rounded-md bg-white/20 hover:bg-white/30 border border-white/10 flex items-center gap-1 text-white text-sm font-medium font-['Lato',sans-serif] transition-all cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#B5C8DB]" />
              </button>
            </div>
          </footer>
        </main>

        {/* Footer */}
        <div className="w-full mt-16">
          <Footer />
        </div>
      </div>

      {/* Audio Player Modal (Desktop - 59: 516px x 737px) */}
      {selectedBriefing && (
        <AudioPlayerModal
          briefing={selectedBriefing}
          onClose={() => setSelectedBriefing(null)}
          onOpenFeedback={() => handleOpenFeedback(selectedBriefing)}
        />
      )}

      {/* Feedback & Rating Modal (Figma Desktop - 60 & 61: 516px x 980px) */}
      {feedbackModalOpen && activeFeedbackBriefing && (
        <FeedbackModal
          briefing={activeFeedbackBriefing}
          onClose={() => {
            setFeedbackModalOpen(false);
            setActiveFeedbackBriefing(null);
          }}
          onSubmitSuccess={() => {
            handleOpenImprove(activeFeedbackBriefing);
          }}
        />
      )}

      {/* Improve Summary Modal (Figma Desktop - 62: 516px x 418px) */}
      {improveModalOpen && activeImproveBriefing && (
        <ImproveSummaryModal
          briefing={activeImproveBriefing}
          onClose={() => {
            setImproveModalOpen(false);
            setActiveImproveBriefing(null);
          }}
          onSkip={() => {
            handleOpenThankYou();
          }}
          onGenerateBetter={() => {
            handleOpenThankYou();
          }}
        />
      )}

      {/* Thank You Confirmation Modal (Figma Desktop - 63: 516px x 359px) */}
      {thankYouModalOpen && (
        <ThankYouModal
          onClose={() => setThankYouModalOpen(false)}
        />
      )}

      {/* Floating Toast Notification with Undo */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#2B2A7D] border border-white/20 text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300">
          <CheckCircle className="w-5 h-5 text-[#36C1FB] shrink-0" />
          <span className="text-sm font-medium font-['Lato',sans-serif]">{toastMessage}</span>
          {removedItem && (
            <button
              type="button"
              onClick={handleUndoRemove}
              className="px-2.5 py-1 rounded bg-white/20 hover:bg-white/30 text-[#36C1FB] text-xs font-bold transition-all cursor-pointer ml-1"
            >
              Undo
            </button>
          )}
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
