"use client";

import React, { useEffect, useState, useMemo } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { adminApi, UserLocationItem, UserLocationsResponse } from "@/lib/api";
import { Globe, Users, Navigation, RotateCw, ZoomIn, ZoomOut, Maximize2, ShieldCheck, X } from "lucide-react";

// Offline self-hosted world TopoJSON map
const GEO_URL = "/maps/world-110m.json";

interface UserLocationMapProps {
  className?: string;
}

export default function UserLocationMap({ className = "" }: UserLocationMapProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const [locations, setLocations] = useState<UserLocationItem[]>([]);
  const [summary, setSummary] = useState({
    total_users_mapped: 0,
    active_countries: 0,
    active_cities: 0,
    countries_list: [] as string[],
  });
  const [selectedPlan, setSelectedPlan] = useState<"ALL" | "Free" | "Pro" | "Enterprise">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredUser, setHoveredUser] = useState<UserLocationItem | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserLocationItem | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([15, 10]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const fetchLocations = async (planFilter: string = "ALL", showSpin = false) => {
    if (showSpin) setIsRefreshing(true);
    try {
      const res: UserLocationsResponse = await adminApi.getUserLocations(planFilter);
      if (res && Array.isArray(res.locations)) {
        setLocations(res.locations);
        if (res.summary) {
          setSummary(res.summary);
        }
      }
    } catch (err) {
      console.error("Failed to load user locations:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLocations(selectedPlan);
  }, [selectedPlan]);

  const filteredLocations = useMemo(() => {
    if (selectedPlan === "ALL") return locations;
    return locations.filter((loc) => loc.plan.toLowerCase() === selectedPlan.toLowerCase());
  }, [locations, selectedPlan]);

  // Color mapping matching user's reference aesthetic
  const getMarkerColor = (plan: string, role?: string) => {
    if (role === "admin") return { dot: "#EF4444", glow: "rgba(239, 68, 68, 0.4)", ring: "#F87171" };
    switch (plan.toLowerCase()) {
      case "pro":
        return { dot: "#F59E0B", glow: "rgba(245, 158, 11, 0.4)", ring: "#FBBF24" };
      case "enterprise":
        return { dot: "#8B5CF6", glow: "rgba(139, 92, 246, 0.4)", ring: "#A78BFA" };
      case "free":
      default:
        return { dot: "#10B981", glow: "rgba(16, 185, 129, 0.4)", ring: "#34D399" };
    }
  };

  const handleZoomIn = () => {
    if (zoom < 4) setZoom((prev) => Math.min(prev * 1.4, 4));
  };

  const handleZoomOut = () => {
    if (zoom > 1) setZoom((prev) => Math.max(prev / 1.4, 1));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setCenter([15, 10]);
  };

  if (!hasMounted) {
    return (
      <div className={`w-full h-[520px] bg-[#0B0F19] border border-white/10 rounded-2xl animate-pulse flex items-center justify-center ${className}`}>
        <p className="text-white/40 text-sm">Initializing global satellite map...</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full bg-[#0B0F19] border border-white/10 rounded-2xl overflow-hidden shadow-2xl font-['Lato',sans-serif] ${className}`}>
      {/* Top Header & Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 md:p-6 border-b border-white/10 bg-[#0F172A]/70 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h3 className="text-lg md:text-xl font-bold text-white tracking-wide">
              Live Global User Distribution
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Real-time
            </span>
          </div>
          <p className="text-xs md:text-sm text-white/50 mt-1">
            Visualizing active user login sessions and geographic traffic around the world
          </p>
        </div>

        {/* Quick Metrics */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10">
            <Users className="w-4 h-4 text-blue-400" />
            <div className="text-left">
              <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Users Mapped</p>
              <p className="text-sm font-bold text-white">{summary.total_users_mapped}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10">
            <Globe className="w-4 h-4 text-emerald-400" />
            <div className="text-left">
              <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Countries</p>
              <p className="text-sm font-bold text-white">{summary.active_countries}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10">
            <Navigation className="w-4 h-4 text-purple-400" />
            <div className="text-left">
              <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Cities</p>
              <p className="text-sm font-bold text-white">{summary.active_cities}</p>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchLocations(selectedPlan, true)}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white/70 hover:text-white border border-white/10 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="Refresh Locations"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter and Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-[#0A0D16] border-b border-white/5 text-xs">
        {/* Plan Filters */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
          {(["ALL", "Free", "Pro", "Enterprise"] as const).map((plan) => (
            <button
              key={plan}
              onClick={() => setSelectedPlan(plan)}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                selectedPlan === plan
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {plan === "ALL" ? "All Plans" : plan}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] text-white/60">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]"></span>
            <span>Free</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]"></span>
            <span>Pro</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] shadow-[0_0_8px_#8B5CF6]"></span>
            <span>Enterprise</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] shadow-[0_0_8px_#EF4444]"></span>
            <span>Admin</span>
          </div>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative w-full h-[450px] md:h-[500px] bg-[#101114] flex items-center justify-center overflow-hidden">
        {/* Background Radial Gradient Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

        {isLoading ? (
          <div className="flex flex-col items-center gap-3 z-10">
            <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-white/60 text-xs tracking-wider uppercase font-semibold">Loading Coordinates...</p>
          </div>
        ) : (
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 120,
              center: [15, 25],
            }}
            className="w-full h-full cursor-grab active:cursor-grabbing select-none"
          >
            <ZoomableGroup
              zoom={zoom}
              center={center}
              onMoveEnd={({ coordinates, zoom: newZoom }) => {
                if (coordinates) setCenter(coordinates as [number, number]);
                if (typeof newZoom === "number") setZoom(newZoom);
              }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#2B2D31"
                      stroke="#1E2024"
                      strokeWidth={0.6}
                      style={{
                        default: {
                          fill: "#2B2D31",
                          stroke: "#1E2024",
                          strokeWidth: 0.6,
                          outline: "none",
                        },
                        hover: {
                          fill: "#3A3D44",
                          stroke: "#4A4E58",
                          strokeWidth: 0.8,
                          outline: "none",
                          cursor: "pointer",
                        },
                        pressed: {
                          fill: "#2563EB",
                          outline: "none",
                        },
                      } as any}
                    />
                  ))
                }
              </Geographies>

              {/* User Markers */}
              {filteredLocations.map((loc) => {
                const colors = getMarkerColor(loc.plan, loc.role);
                const isHovered = hoveredUser?.id === loc.id || selectedUser?.id === loc.id;

                return (
                  <Marker
                    key={loc.id}
                    coordinates={[loc.longitude, loc.latitude]}
                    onClick={() => setSelectedUser(loc)}
                    onMouseEnter={() => setHoveredUser(loc)}
                    onMouseLeave={() => setHoveredUser(null)}
                  >
                    <g className="cursor-pointer transition-transform duration-200 hover:scale-125">
                      {/* Large invisible hit area for easy hover/tap */}
                      <circle r={16} fill="transparent" />
                      {/* Outer Pulse Ring */}
                      <circle
                        r={isHovered ? 13 : 8}
                        fill={colors.dot}
                        opacity="0.35"
                        className="animate-ping"
                      />
                      {/* Secondary Soft Glow */}
                      <circle
                        r={isHovered ? 9 : 5.5}
                        fill={colors.glow}
                      />
                      {/* Center Solid Dot */}
                      <circle
                        r={isHovered ? 5.5 : 3.8}
                        fill={colors.dot}
                        stroke="#0F172A"
                        strokeWidth={1.5}
                      />
                    </g>
                  </Marker>
                );
              })}
            </ZoomableGroup>
          </ComposableMap>
        )}

        {/* Map Floating Zoom Controls */}
        <div className="absolute bottom-5 right-5 flex flex-col gap-1.5 z-20">
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-lg bg-[#0F172A]/90 hover:bg-[#1E293B] text-white/80 hover:text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-lg bg-[#0F172A]/90 hover:bg-[#1E293B] text-white/80 hover:text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="w-8 h-8 rounded-lg bg-[#0F172A]/90 hover:bg-[#1E293B] text-white/80 hover:text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
            title="Reset View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Floating Hover / Click User Card */}
        {(hoveredUser || selectedUser) && (
          <div className="absolute top-4 left-4 z-30 w-72 bg-[#0F172A]/95 border border-white/15 rounded-xl p-4 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow-md border border-white/20 shrink-0">
                  {(hoveredUser || selectedUser)!.user_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-white truncate">{(hoveredUser || selectedUser)!.user_name}</p>
                    {(hoveredUser || selectedUser)!.role === "admin" && (
                      <ShieldCheck className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-white/60 truncate">{(hoveredUser || selectedUser)!.email}</p>
                </div>
              </div>

              {selectedUser && (
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer"
                  title="Close popup"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-wider block font-semibold">Location</span>
                <span className="text-white font-medium truncate block">
                  {(hoveredUser || selectedUser)!.city}, {(hoveredUser || selectedUser)!.country_code || (hoveredUser || selectedUser)!.country}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-wider block font-semibold">Plan</span>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold mt-0.5 ${
                    (hoveredUser || selectedUser)!.plan === "Pro"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : (hoveredUser || selectedUser)!.plan === "Enterprise"
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {(hoveredUser || selectedUser)!.plan}
                </span>
              </div>
              <div className="col-span-2 mt-1">
                <span className="text-[10px] text-white/40 uppercase tracking-wider block font-semibold">Last Active Session</span>
                <span className="text-white/80 font-mono text-[11px] block">{(hoveredUser || selectedUser)!.date_time}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Info */}
      <div className="px-6 py-3.5 bg-[#0A0D16] border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-white/50">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
          <span>Showing {filteredLocations.length} active global login origins</span>
        </div>
        <div>
          <span>MaxMind GeoIP2 Engine • High-precision coordinate resolution</span>
        </div>
      </div>
    </div>
  );
}
