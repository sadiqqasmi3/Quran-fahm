import type { Metadata } from "next";
import { SalahComprehension } from "@/components/salah-comprehension";

export const metadata: Metadata = {
  title: "Salah",
  description: "Build direct recognition of the Quran and phrases recited in Salah.",
};

export default function SalahPage() {
  return <SalahComprehension />;
}
