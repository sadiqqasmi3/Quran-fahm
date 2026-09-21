import type { Metadata } from "next";
import { ReaderWorkspace } from "@/components/reader-workspace";

export const metadata: Metadata = { title: "Quran reader" };

export default async function QuranPage({
  searchParams,
}: {
  searchParams: Promise<{ surah?: string; ayah?: string }>;
}) {
  const parameters = await searchParams;
  const requested = Number.parseInt(parameters.surah ?? "1", 10);
  const requestedAyah = Number.parseInt(parameters.ayah ?? "", 10);
  const initialSurahNumber =
    Number.isInteger(requested) && requested >= 1 && requested <= 114 ? requested : 1;
  return (
    <ReaderWorkspace
      initialSurahNumber={initialSurahNumber}
      {...(Number.isInteger(requestedAyah) && requestedAyah > 0
        ? { initialAyahNumber: requestedAyah }
        : {})}
    />
  );
}
