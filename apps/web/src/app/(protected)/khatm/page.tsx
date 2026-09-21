import type { Metadata } from "next";
import { KhatmWorkspace } from "@/components/khatm-workspace";

export const metadata: Metadata = { title: "Khatm" };

export default function KhatmPage() {
  return <KhatmWorkspace />;
}
