import type { Metadata } from "next";
import { ProgressDashboard } from "@/components/progress-dashboard";

export const metadata: Metadata = {
  title: "Progress",
  description:
    "Review Quran Feham learning, listening, and activity progress saved on this device.",
};

export default function ProgressPage() {
  return <ProgressDashboard />;
}
