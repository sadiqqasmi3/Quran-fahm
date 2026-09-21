import type { Metadata } from "next";
import { AskWorkspace } from "@/components/ask-workspace";
import { PageHeading } from "@/components/page-heading";

export const metadata: Metadata = { title: "Ask Quran Feham" };

function validCoordinate(value: string | undefined, maximum: number, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= maximum ? parsed : fallback;
}

export default async function AskPage({
  searchParams,
}: {
  searchParams: Promise<{ surah?: string; ayah?: string }>;
}) {
  const parameters = await searchParams;
  return (
    <>
      <PageHeading
        title="Ask Quran Feham"
        description="Ask about a selected ayah with a clear boundary between Quran, named translation and limited teaching help."
      />
      <AskWorkspace
        initialSurahNumber={validCoordinate(parameters.surah, 114, 1)}
        initialAyahNumber={validCoordinate(parameters.ayah, 286, 1)}
      />
    </>
  );
}
