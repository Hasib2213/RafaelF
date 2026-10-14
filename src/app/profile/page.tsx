"use client";

import React, { useState, useRef, useEffect } from "react";
import FeedSidebar from "@/components/feed/FeedSidebar";
import FeedNavbar from "@/components/feed/FeedNavbar";
import Footer from "@/components/Footer";
import { Camera, Trash2, Eye, EyeOff, Check, AlertCircle, Loader2, User as UserIcon, X, ZoomIn, Download } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authApi, resolveAvatarUrl } from "@/lib/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function ProfilePage() {
  const { user, setUser, refreshUser } = useAuth();

  // Initial profile data
  const initialProfile = {
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    company: user?.company || "",
    position: user?.position || "",
    avatar: resolveAvatarUrl(user?.avatar_url || user?.avatar) || "",
  };

  // Form states
  const [profile, setProfile] = useState(initialProfile);
  const [tempProfile, setTempProfile] = useState(initialProfile);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Password states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Loading states
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Avatar file upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Fetch current user from backend on mount
  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      try {
        setIsLoadingProfile(true);
        const data = await authApi.getProfile();
        if (isMounted && data) {
          const avatar = resolveAvatarUrl(data.avatar_url || data.avatar) || "";
          const loaded = {
            firstName: data.first_name || "",
            lastName: data.last_name || "",
            phone: data.phone || "",
            address: data.address || "",
            company: data.company || "",
            position: data.position || "",
            avatar,
          };
          setProfile(loaded);
          setTempProfile(loaded);
          setAvatarLoadError(false);
          setUser(data);
        }
      } catch (err: any) {
        // Fallback to auth context or default
        if (user) {
          const avatar = resolveAvatarUrl(user.avatar_url || user.avatar) || "";
          const fallback = {
            firstName: user.first_name || "",
            lastName: user.last_name || "",
            phone: user.phone || "",
            address: user.address || "",
            company: user.company || "",
            position: user.position || "",
            avatar,
          };
          setProfile(fallback);
          setTempProfile(fallback);
          setAvatarLoadError(false);
        }
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    }
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsPreviewModalOpen(false);
      }
    };
    if (isPreviewModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPreviewModalOpen]);

  // Profile save & cancel
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      let updated: any;
      if (avatarFile) {
        const fd = new FormData();
        fd.append("first_name", tempProfile.firstName || "");
        fd.append("last_name", tempProfile.lastName || "");
        fd.append("phone", tempProfile.phone || "");
        fd.append("address", tempProfile.address || "");
        fd.append("company", tempProfile.company || "");
        fd.append("position", tempProfile.position || "");
        fd.append("avatar", avatarFile);

        updated = await authApi.updateProfile(fd);
      } else {
        const payload: any = {
          first_name: tempProfile.firstName,
          last_name: tempProfile.lastName,
          phone: tempProfile.phone,
          address: tempProfile.address,
          company: tempProfile.company,
          position: tempProfile.position,
        };
        if (removeAvatar) {
          payload.remove_avatar = true;
        }
        updated = await authApi.updateProfile(payload);
      }

      const avatar = resolveAvatarUrl(updated.avatar_url || updated.avatar) || "";

      const saved = {
        firstName: updated.first_name || tempProfile.firstName,
        lastName: updated.last_name || tempProfile.lastName,
        phone: updated.phone || tempProfile.phone,
        address: updated.address || tempProfile.address,
        company: updated.company || tempProfile.company,
        position: updated.position || tempProfile.position,
        avatar,
      };
      setProfile(saved);
      setTempProfile(saved);
      setAvatarFile(null);
      setRemoveAvatar(false);
      setAvatarLoadError(false);

      // Immediately synchronize global AuthContext
      setUser(updated);
      await refreshUser();
      showToast("Profile settings updated successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update profile", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelProfile = () => {
    setTempProfile({ ...profile });
    setAvatarFile(null);
    setRemoveAvatar(false);
    setAvatarLoadError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    showToast("Profile changes reverted.");
  };

  // Password save & cancel
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword.trim() || !newPassword.trim()) {
      showToast("Please enter both old and new passwords.", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("New password must be at least 6 characters.", "error");
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await authApi.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: newPassword,
      });
      showToast(res.message || "Password updated successfully!", "success");
      setOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      showToast(err.message || "Failed to update password", "error");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleCancelPassword = () => {
    setOldPassword("");
    setNewPassword("");
    setShowOldPassword(false);
    setShowNewPassword(false);
    showToast("Password changes cancelled.");
  };

  // Avatar change handler
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setRemoveAvatar(false);
      const objectUrl = URL.createObjectURL(file);
      setTempProfile((prev) => ({ ...prev, avatar: objectUrl }));
      setAvatarLoadError(false);
      showToast("New profile picture selected. Click 'Save Changes' to apply.");
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setTempProfile((prev) => ({ ...prev, avatar: "" }));
    setRemoveAvatar(true);
    setAvatarLoadError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    showToast("Profile picture removed. Click 'Save Changes' to apply.");
  };

  const userInitials =
    (
      (tempProfile.firstName ? tempProfile.firstName[0] : "") +
      (tempProfile.lastName ? tempProfile.lastName[0] : "")
    ).toUpperCase() || (user?.email ? user.email.slice(0, 2).toUpperCase() : "");

  const avatarSrc = resolveAvatarUrl(tempProfile.avatar) || tempProfile.avatar;

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-[#0F172A] text-white font-['Lato',sans-serif]">
      {/* Left Sidebar (Figma Desktop - 7 Side Panel: 240px wide, Profile active, responsive on mobile) */}
      <FeedSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Right Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Nav (Figma Desktop - 7 Nav: 80px height) */}
        <FeedNavbar
          showSearch={false}
          userSubtitle={user?.email || "abir07@gmai.com"}
          onMobileMenuToggle={() => setMobileSidebarOpen((prev) => !prev)}
        />

        {/* Main Content Area (Figma Frame 2147227640: 1152px wide) */}
        <main className="flex-1 w-full max-w-[1152px] mx-auto px-6 py-6 flex flex-col gap-6">
          {/* Header (Figma Frame 2147227774 / Frame 2147239908: 1152px x 66px) */}
          <section className="w-full flex flex-col gap-1 py-2">
            <h1 className="text-[28px] font-semibold text-white leading-[135%] tracking-[-0.02em] font-['Lato',sans-serif]">
              Profile Settings
            </h1>
            <p className="text-base font-normal text-[#D0D0D0] leading-[150%] tracking-[-0.02em] font-['Lato',sans-serif]">
              Manage your profile setting from here
            </p>
          </section>

          {/* Card 1: Profile Settings Card (Figma Frame 2147224438: 1152px x 770px) */}
          <section className="w-full rounded-2xl p-6 bg-[#2B2A7D] [background-image:linear-gradient(90deg,rgba(43,127,255,0.2)_0%,rgba(79,57,246,0.2)_100%)] border border-white/10 shadow-[0_1px_12px_rgba(0,0,0,0.15)] flex flex-col gap-6">
            <form onSubmit={handleSaveProfile} className="w-full flex flex-col gap-6">
              {/* Profile Picture Section (Figma Frame 2147224435: 1104px x 288px) */}
              <div className="flex flex-col gap-4">
                <h2 className="text-2xl font-medium text-white leading-[140%] tracking-[-0.02em] font-['Lato',sans-serif]">
                  Profile Picture:
                </h2>

                {/* Avatar Frame with Camera Edit Badge (Figma Frame 2147225842 & fi_45010) */}
                <div className="relative w-[234px] h-[234px] group">
                  <div
                    onClick={() => {
                      if (avatarSrc && !avatarLoadError) {
                        setIsPreviewModalOpen(true);
                      }
                    }}
                    className={`w-[234px] h-[234px] rounded-full border-2 border-white/40 overflow-hidden shadow-2xl bg-gradient-to-tr from-[#2563EB] to-[#A842D4] flex items-center justify-center select-none relative ${
                      avatarSrc && !avatarLoadError ? "cursor-pointer group-hover:border-white/80 transition-all" : ""
                    }`}
                    title={avatarSrc && !avatarLoadError ? "Click to view full photo" : undefined}
                  >
                    {avatarSrc && !avatarLoadError ? (
                      <>
                        <img
                          src={avatarSrc}
                          alt="Profile Avatar"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={() => setAvatarLoadError(true)}
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white">
                          <ZoomIn className="w-8 h-8 drop-shadow-lg" />
                          <span className="text-xs font-semibold drop-shadow tracking-wide">View Full Photo</span>
                        </div>
                      </>
                    ) : userInitials ? (
                      <span className="text-6xl font-bold font-['Lato',sans-serif] text-white tracking-wider drop-shadow-md">
                        {userInitials}
                      </span>
                    ) : (
                      <UserIcon className="w-24 h-24 text-white/80" />
                    )}
                  </div>

                  {/* Action Badges: View Full Photo, Remove (when photo exists) & Upload */}
                  <div className="absolute right-2 bottom-2 flex items-center gap-2">
                    {Boolean(avatarSrc && !avatarLoadError) && (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsPreviewModalOpen(true)}
                          aria-label="View full profile picture"
                          title="View full profile picture"
                          className="w-[42px] h-[42px] bg-white/30 hover:bg-white/50 active:scale-95 backdrop-blur-md rounded-lg border border-white/30 flex items-center justify-center transition-all cursor-pointer shadow-lg group/btn"
                        >
                          <Eye className="w-5 h-5 text-white group-hover/btn:scale-110 transition-transform" />
                        </button>

                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          aria-label="Remove profile picture"
                          title="Remove profile picture"
                          className="w-[42px] h-[42px] bg-red-500/60 hover:bg-red-500/85 active:scale-95 backdrop-blur-md rounded-lg border border-red-300/40 flex items-center justify-center transition-all cursor-pointer shadow-lg group/btn"
                        >
                          <Trash2 className="w-5 h-5 text-white group-hover/btn:scale-110 transition-transform" />
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Change profile picture"
                      title="Upload new profile picture"
                      className="w-[48px] h-[42px] bg-white/40 hover:bg-white/60 active:scale-95 backdrop-blur-md rounded-lg border border-white/30 flex items-center justify-center transition-all cursor-pointer shadow-lg group/btn"
                    >
                      <Camera className="w-6 h-6 text-white group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Form Fields Section (Figma Frame 2147227771: 1104px x 342px) */}
              <div className="flex flex-col gap-4 pt-2">
                {/* Divider Line 5 */}
                <div className="w-full h-0 border-t border-[#B5C8DB]/30" />

                {/* Row 1: Name (Figma Frame 2147225848) */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-2">
                  <div className="w-32 shrink-0">
                    <span className="text-base font-medium text-white font-['Lato',sans-serif]">
                      Name
                    </span>
                  </div>

                  {/* Inputs: First Name & Last Name (Figma Frame 1261156031: 737px x 78px) */}
                  <div className="flex-1 w-full max-w-[737px] grid grid-cols-1 sm:grid-cols-2 gap-[14.42px]">
                    {/* First Name */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="firstName"
                        className="text-base font-medium text-white font-['Lato',sans-serif]"
                      >
                        First Name
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        value={tempProfile.firstName}
                        onChange={(e) =>
                          setTempProfile({ ...tempProfile, firstName: e.target.value })
                        }
                        className="w-full h-12 px-4 rounded-lg bg-white/20 hover:bg-white/25 focus:bg-white/25 border border-white/10 focus:border-[#36C1FB] focus:outline-none text-base font-medium text-white placeholder-white/50 transition-colors font-['Lato',sans-serif]"
                        placeholder="First Name"
                      />
                    </div>

                    {/* Last Name */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="lastName"
                        className="text-base font-medium text-white font-['Lato',sans-serif]"
                      >
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        value={tempProfile.lastName}
                        onChange={(e) =>
                          setTempProfile({ ...tempProfile, lastName: e.target.value })
                        }
                        className="w-full h-12 px-4 rounded-lg bg-white/20 hover:bg-white/25 focus:bg-white/25 border border-white/10 focus:border-[#36C1FB] focus:outline-none text-base font-medium text-white placeholder-white/50 transition-colors font-['Lato',sans-serif]"
                        placeholder="Last Name"
                      />
                    </div>
                  </div>
                </div>

                {/* Divider Line 6 */}
                <div className="w-full h-0 border-t border-[#B5C8DB]/30" />

                {/* Row 2: Contact (Figma Frame 2147225848) */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-2">
                  <div className="w-32 shrink-0">
                    <span className="text-base font-medium text-white font-['Lato',sans-serif]">
                      Contact
                    </span>
                  </div>

                  {/* Inputs: Phone & Address (737px wide) */}
                  <div className="flex-1 w-full max-w-[737px] grid grid-cols-1 sm:grid-cols-2 gap-[14.42px]">
                    {/* Phone */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="phone"
                        className="text-base font-medium text-white font-['Lato',sans-serif]"
                      >
                        Phone
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={tempProfile.phone}
                        onChange={(e) =>
                          setTempProfile({ ...tempProfile, phone: e.target.value })
                        }
                        className="w-full h-12 px-4 rounded-lg bg-white/20 hover:bg-white/25 focus:bg-white/25 border border-white/10 focus:border-[#36C1FB] focus:outline-none text-base font-medium text-white placeholder-white/50 transition-colors font-['Lato',sans-serif]"
                        placeholder="Phone number"
                      />
                    </div>

                    {/* Address */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="address"
                        className="text-base font-medium text-white font-['Lato',sans-serif]"
                      >
                        Address
                      </label>
                      <input
                        id="address"
                        type="text"
                        value={tempProfile.address}
                        onChange={(e) =>
                          setTempProfile({ ...tempProfile, address: e.target.value })
                        }
                        className="w-full h-12 px-4 rounded-lg bg-white/20 hover:bg-white/25 focus:bg-white/25 border border-white/10 focus:border-[#36C1FB] focus:outline-none text-base font-medium text-white placeholder-white/50 transition-colors font-['Lato',sans-serif]"
                        placeholder="Address"
                      />
                    </div>
                  </div>
                </div>

                {/* Divider Line 6 */}
                <div className="w-full h-0 border-t border-[#B5C8DB]/30" />

                {/* Row 3: Work Information (Figma Frame 2147225857) */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-2">
                  <div className="w-32 shrink-0">
                    <span className="text-base font-medium text-white font-['Lato',sans-serif]">
                      Work Information
                    </span>
                  </div>

                  {/* Inputs: Company & Position (737px wide) */}
                  <div className="flex-1 w-full max-w-[737px] grid grid-cols-1 sm:grid-cols-2 gap-[14.42px]">
                    {/* Company */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="company"
                        className="text-base font-medium text-white font-['Lato',sans-serif]"
                      >
                        Company
                      </label>
                      <input
                        id="company"
                        type="text"
                        value={tempProfile.company}
                        onChange={(e) =>
                          setTempProfile({ ...tempProfile, company: e.target.value })
                        }
                        className="w-full h-12 px-4 rounded-lg bg-white/20 hover:bg-white/25 focus:bg-white/25 border border-white/10 focus:border-[#36C1FB] focus:outline-none text-base font-medium text-white placeholder-white/50 transition-colors font-['Lato',sans-serif]"
                        placeholder="Company name"
                      />
                    </div>

                    {/* Position */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="position"
                        className="text-base font-medium text-white font-['Lato',sans-serif]"
                      >
                        Position
                      </label>
                      <input
                        id="position"
                        type="text"
                        value={tempProfile.position}
                        onChange={(e) =>
                          setTempProfile({ ...tempProfile, position: e.target.value })
                        }
                        className="w-full h-12 px-4 rounded-lg bg-white/20 hover:bg-white/25 focus:bg-white/25 border border-white/10 focus:border-[#36C1FB] focus:outline-none text-base font-medium text-white placeholder-white/50 transition-colors font-['Lato',sans-serif]"
                        placeholder="Position"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row (Figma Frame 2147229847: 242px x 44px, gap 16px) */}
              <div className="w-full flex justify-end items-center gap-4 pt-4">
                {/* Cancel Button (Figma Frame 2147239918: 80px x 44px) */}
                <button
                  type="button"
                  onClick={handleCancelProfile}
                  disabled={isSavingProfile}
                  className="w-20 h-11 px-4 rounded-lg bg-white/20 hover:bg-white/30 active:scale-95 text-white text-base font-semibold font-['Lato',sans-serif] transition-all cursor-pointer select-none disabled:opacity-50"
                >
                  Cancel
                </button>

                {/* Save Changes Button (Figma Frame 2147224437: 146px x 44px) */}
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-[146px] h-11 px-4 rounded-lg bg-gradient-to-r from-[#2563EB] via-[#7A3BED] to-[#A842D4] hover:opacity-95 active:scale-95 text-white text-base font-semibold font-['Lato',sans-serif] transition-all shadow-md cursor-pointer select-none flex items-center justify-center disabled:opacity-60"
                >
                  {isSavingProfile ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* Card 2: Change Password Card (Figma Frame 2147227640: 1152px x 200px) */}
          <section className="w-full rounded-[14px] p-6 bg-[#2B2A7D] [background-image:linear-gradient(90deg,rgba(43,127,255,0.2)_0%,rgba(79,57,246,0.2)_100%)] border border-white/10 shadow-[0_1px_12px_rgba(0,0,0,0.15)] flex flex-col gap-6">
            <form onSubmit={handleSavePassword} className="w-full flex flex-col gap-6">
              {/* Row: Change Password Inputs (Figma Frame 2147225848) */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="w-36 shrink-0">
                  <span className="text-base font-medium text-white font-['Lato',sans-serif]">
                    Change Password
                  </span>
                </div>

                {/* Inputs: Old Password & New Password (737px wide) */}
                <div className="flex-1 w-full max-w-[737px] grid grid-cols-1 sm:grid-cols-2 gap-[14.42px]">
                  {/* Old Password */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="oldPassword"
                      className="text-base font-medium text-white font-['Lato',sans-serif]"
                    >
                      Old Password
                    </label>
                    <div className="relative w-full">
                      <input
                        id="oldPassword"
                        type={showOldPassword ? "text" : "password"}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full h-12 pl-4 pr-11 rounded-lg bg-white/20 hover:bg-white/25 focus:bg-white/25 border border-white/10 focus:border-[#36C1FB] focus:outline-none text-base font-medium text-white placeholder-white/50 transition-colors font-['Lato',sans-serif]"
                        placeholder="Old Password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        aria-label={showOldPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                      >
                        {showOldPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="newPassword"
                      className="text-base font-medium text-white font-['Lato',sans-serif]"
                    >
                      New Password
                    </label>
                    <div className="relative w-full">
                      <input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full h-12 pl-4 pr-11 rounded-lg bg-white/20 hover:bg-white/25 focus:bg-white/25 border border-white/10 focus:border-[#36C1FB] focus:outline-none text-base font-medium text-white placeholder-white/50 transition-colors font-['Lato',sans-serif]"
                        placeholder="New Password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row (Figma Frame 2147229848: 242px x 44px) */}
              <div className="w-full flex justify-end items-center gap-4 pt-2">
                {/* Cancel */}
                <button
                  type="button"
                  onClick={handleCancelPassword}
                  disabled={isSavingPassword}
                  className="w-20 h-11 px-4 rounded-lg bg-white/20 hover:bg-white/30 active:scale-95 text-white text-base font-semibold font-['Lato',sans-serif] transition-all cursor-pointer select-none disabled:opacity-50"
                >
                  Cancel
                </button>

                {/* Save Changes */}
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="w-[146px] h-11 px-4 rounded-lg bg-gradient-to-r from-[#2563EB] via-[#7A3BED] to-[#A842D4] hover:opacity-95 active:scale-95 text-white text-base font-semibold font-['Lato',sans-serif] transition-all shadow-md cursor-pointer select-none flex items-center justify-center disabled:opacity-60"
                >
                  {isSavingPassword ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </section>
        </main>

        {/* Desktop - 7 Footer (1440px x 501px bottom footer) */}
        <div className="w-full mt-12">
          <Footer />
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200 ${
            toastType === "error"
              ? "bg-[#3B1522] border-rose-500/50 text-rose-200"
              : "bg-gradient-to-r from-[#1E1B4B] to-[#2B2A7D] border-[#7A3BED]/50 text-white"
          }`}
        >
          {toastType === "error" ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" strokeWidth={2.5} />
          ) : (
            <Check className="w-5 h-5 text-[#36C1FB] shrink-0" strokeWidth={2.5} />
          )}
          <span className="text-sm font-medium font-['Lato',sans-serif]">
            {toastMessage}
          </span>
        </div>
      )}

      {/* Full Photo Preview Lightbox Modal */}
      {isPreviewModalOpen && avatarSrc && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsPreviewModalOpen(false)}
        >
          {/* Modal Container */}
          <div
            className="relative max-w-2xl w-full bg-[#1A1848]/95 border border-white/20 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#2B2A7D]/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/30 shrink-0 bg-slate-800">
                  <img src={avatarSrc} alt="Thumbnail" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white leading-tight font-['Lato',sans-serif]">
                    Profile Photo Preview
                  </h3>
                  <p className="text-xs text-white/60 font-['Lato',sans-serif]">
                    {tempProfile.firstName || tempProfile.lastName
                      ? `${tempProfile.firstName} ${tempProfile.lastName}`.trim()
                      : user?.email}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                aria-label="Close preview"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image Area */}
            <div className="w-full max-h-[70vh] min-h-[260px] bg-black/40 flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none">
              <img
                src={avatarSrc}
                alt="Full Profile Photo"
                className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-2xl border border-white/10"
              />
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-white/10 bg-[#2B2A7D]/40">
              <span className="text-xs text-white/50 hidden sm:inline font-['Lato',sans-serif]">
                Press ESC or click outside to close
              </span>
              <div className="flex items-center gap-3 ml-auto">
                <a
                  href={avatarSrc}
                  target="_blank"
                  rel="noreferrer"
                  download="profile_photo.jpg"
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Photo</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setIsPreviewModalOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#2563EB] to-[#7A3BED] hover:brightness-110 text-white text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-purple-900/30 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Change Photo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
