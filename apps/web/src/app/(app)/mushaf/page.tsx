"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Mushaf15Reader } from "@/components/mushaf-15-reader";

function MushafView() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paraParam = searchParams.get("para");
  const pageParam = searchParams.get("page");

  const initialPara = paraParam ? Number.parseInt(paraParam, 10) : 1;
  const initialPage = pageParam ? Number.parseInt(pageParam, 10) : undefined;

  return (
    <Mushaf15Reader
      initialPara={Number.isNaN(initialPara) ? 1 : initialPara}
      initialPage={Number.isNaN(initialPage as number) ? undefined : initialPage}
      onClose={() => router.back()}
    />
  );
}

export default function MushafPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18231d] text-white">
          <p className="font-semibold text-emerald-300 animate-pulse">
            Loading 15-Line Mushaf…
          </p>
        </div>
      }
    >
      <MushafView />
    </Suspense>
  );
}
