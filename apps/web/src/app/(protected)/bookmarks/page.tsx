import type { Metadata } from "next";
import { BookmarksWorkspace } from "@/components/bookmarks-workspace";

export const metadata: Metadata = {
  title: "Bookmarks",
  description: "Return to Quran ayahs saved on this device.",
};

export default function BookmarksPage() {
  return <BookmarksWorkspace />;
}
