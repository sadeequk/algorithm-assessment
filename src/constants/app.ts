export const APP_NAME = "Algorithm · Support Ops";

export const APP_DESCRIPTION =
  "Algorithm Full Stack Engineer (AI-First) assessment — support operations console";

export const DEFAULT_REVIEWER = "reviewer";

export const NAV_LINKS = [
  { href: "/", label: "Queue" },
  { href: "/submit", label: "New request" },
] as const;

export const EXAMPLE_SUPPORT_MESSAGES = [
  "I want a refund for order 1043.",
  "Cancel my order 1044, it hasn't shipped.",
  "This arrived damaged, send a replacement for order 3001.",
  "Cancel order 2001 please.",
  "Refund order 6001.",
  "Cancel order 7001, it hasn't shipped.",
  "Refund order 9999 please.",
] as const;

export const EXAMPLE_CUSTOMER_EMAIL = "alice@example.com";

export const STATUS_BADGE_STYLES: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  RECEIVED: { bg: "#eef2f6", color: "#475569", border: "#d5dde8" },
  PROCESSING: { bg: "#eaf2ff", color: "#1d4ed8", border: "#c7dbff" },
  AUTO_RESOLVED: { bg: "#e8f7ef", color: "#0f7a4c", border: "#b7e4cb" },
  ESCALATED: { bg: "#fff6e0", color: "#9a6700", border: "#f0d79a" },
  APPROVED: { bg: "#e6f4f4", color: "#0d6e6e", border: "#b7dede" },
  REJECTED: { bg: "#fdecec", color: "#c0353a", border: "#f3c1c3" },
  FAILED: { bg: "#fdecec", color: "#8f2226", border: "#f0b0b3" },
  PENDING: { bg: "#fff6e0", color: "#9a6700", border: "#f0d79a" },
  SHIPPED: { bg: "#eaf2ff", color: "#1d4ed8", border: "#c7dbff" },
  DELIVERED: { bg: "#e8f7ef", color: "#0f7a4c", border: "#b7e4cb" },
  CANCELLED: { bg: "#eef2f6", color: "#64748b", border: "#d5dde8" },
  RUNNING: { bg: "#eaf2ff", color: "#1d4ed8", border: "#c7dbff" },
  COMPLETED: { bg: "#e8f7ef", color: "#0f7a4c", border: "#b7e4cb" },
};
