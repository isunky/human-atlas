import { isTauri } from "@tauri-apps/api/core";

export function runtimeInfo() {
  return { native: isTauri(), version: "0.1.0" };
}

export async function openExternal(url: string) {
  if (new URL(url).protocol !== "https:") throw new Error("Only HTTPS links are supported.");
  if (isTauri()) {
    const { openUrl } = await import("@tauri-apps/plugin-opener");
    await openUrl(url);
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
