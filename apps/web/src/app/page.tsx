import type { Metadata } from "next";
import { LandingView } from "@/components/landing-view";

export const metadata: Metadata = {
  title: "Quran Feham · فہمِ قرآن",
  description:
    "A personal Quran comprehension, 15-line Mushaf, reading, recitation, and family Khatm platform in Urdu and English.",
};

export default function LandingPage() {
  return <LandingView />;
}
