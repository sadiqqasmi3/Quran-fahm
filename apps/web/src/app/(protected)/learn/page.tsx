import type { Metadata } from "next";
import { LearnExperience } from "@/components/learn-experience";

export const metadata: Metadata = {
  title: "Learn Quranic Arabic",
  description: "Short Quranic Arabic vocabulary and phrase reviews using Urdu as a bridge.",
};

export default function LearnPage() {
  return <LearnExperience />;
}
