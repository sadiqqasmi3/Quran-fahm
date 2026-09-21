import type { Metadata } from "next";
import { ExploreWorkspace } from "@/components/explore-workspace";
import { PageHeading } from "@/components/page-heading";

export const metadata: Metadata = { title: "Explore Quranic language" };

export default function ExplorePage() {
  return (
    <>
      <PageHeading
        title="Explore"
        description="Recognize Quranic words and root families, then search the exact Quran or a named Urdu translation."
      />
      <ExploreWorkspace />
    </>
  );
}
