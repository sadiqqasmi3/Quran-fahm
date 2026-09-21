import type { Metadata } from "next";
import { KhatmInvitation } from "@/components/khatm-invitation";
import { PublicFooter, PublicHeader } from "@/components/public-chrome";

export const metadata: Metadata = {
  title: "Join a Khatm room",
  description: "Open a private Quran Feham invitation and choose a Para to read.",
  robots: { index: false, follow: false },
};

export default async function JoinKhatmPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return (
    <>
      <PublicHeader />
      <KhatmInvitation credential={code} />
      <PublicFooter />
    </>
  );
}
