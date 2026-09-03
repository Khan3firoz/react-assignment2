/**
 * Frontend-only share simulation. There is no backend, so "Anyone with link"
 * just means we mint a fake shareable URL and remember the choice in
 * localStorage. Nothing is actually published anywhere.
 */

const SHARE_KEY = "operations-dashboard:share";

export type ShareVisibility = "private" | "link";

export interface ShareState {
  visibility: ShareVisibility;
  /** Present only while visibility === "link". */
  url: string | null;
}

const DEFAULT: ShareState = { visibility: "private", url: null };

function makeToken(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 6)
  );
}

export function loadShareState(): ShareState {
  try {
    const raw = localStorage.getItem(SHARE_KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw);
    if (parsed?.visibility === "link" && typeof parsed.url === "string") {
      return { visibility: "link", url: parsed.url };
    }
    return { ...DEFAULT };
  } catch {
    return { ...DEFAULT };
  }
}

export function setShareVisibility(visibility: ShareVisibility): ShareState {
  const next: ShareState =
    visibility === "link"
      ? {
          visibility: "link",
          url: `${window.location.origin}${window.location.pathname}#/share/${makeToken()}`,
        }
      : { ...DEFAULT };
  try {
    localStorage.setItem(SHARE_KEY, JSON.stringify(next));
  } catch (err) {
    console.error("Failed to persist share state", err);
  }
  return next;
}
