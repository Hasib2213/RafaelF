import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Downloads an audio file from a direct URL (e.g. Cloudinary) to the user's computer.
 * Fetches the file as a Blob to enforce browser downloading instead of navigating/streaming.
 */
export async function downloadAudioFile(url: string, title?: string): Promise<boolean> {
  if (!url || typeof window === "undefined") return false;

  const safeTitle = (title || "audio_briefing")
    .replace(/[^\w\s-]/gi, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 50);
  const filename = `${safeTitle || "audio_briefing"}.mp3`;

  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.style.display = "none";
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 1500);
    return true;
  } catch (error) {
    console.warn("[downloadAudioFile] Fetch blob failed, falling back to direct link download:", error);
    try {
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = filename;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    } catch {
      window.open(url, "_blank");
      return true;
    }
  }
}
