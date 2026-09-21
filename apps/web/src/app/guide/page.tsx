import type { Metadata } from "next";
import { AppGuideWorkspace } from "@/components/app-guide-workspace";
import { PublicFooter, PublicHeader } from "@/components/public-chrome";

export const metadata: Metadata = {
  title: "App Guide · رہنمائے استعمال",
  description:
    "How to use Quran Feham: 15-line Mushaf, daily Quran reading, family Khatm rooms, vocabulary, and offline reading in Urdu and English.",
};

export default function PublicGuidePage() {
  return (
    <div className="min-h-dvh bg-canvas">
      <PublicHeader />
      <AppGuideWorkspace showHeaderBack={false} />
      <PublicFooter />
    </div>
  );
}
