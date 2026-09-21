import type { Metadata } from "next";
import { DownloadsWorkspace } from "@/components/downloads-workspace";

export const metadata: Metadata = { title: "Offline downloads" };

export default function DownloadsPage() {
  return <DownloadsWorkspace />;
}
