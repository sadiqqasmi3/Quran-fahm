import type { Metadata } from "next";
import { ReciteListeningPractice } from "@/components/recite-listening-practice";

export const metadata: Metadata = {
  title: "Recite",
  description: "Quran listening comprehension and the roadmap for Recitation Assist.",
};

export default function RecitePage() {
  return <ReciteListeningPractice />;
}
