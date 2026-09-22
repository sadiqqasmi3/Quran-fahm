"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Mushaf15Reader } from "@/components/mushaf-15-reader";

function MushafView() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paraParam = searchParams.get("para");
  const pageParam = searchParams.get("page");

  const initialPara = paraParam ? Number.parseInt(paraParam, 10) : undefined;
  const initialPage = pageParam ? Number.parseInt(pageParam, 10) : undefined;

  const handleClose = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/home");
    }
  };

  return (
    <Mushaf15Reader
      initialPara={typeof initialPara === "number" && !Number.isNaN(initialPara) ? initialPara : undefined}
      initialPage={typeof initialPage === "number" && !Number.isNaN(initialPage) ? initialPage : undefined}
      onClose={handleClose}
    />
  );
}

export default function MushafPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#18231d] text-white">
          <div className="size-10 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mb-3" />
          <p className="font-semibold text-emerald-300">
            Loading 15-Line Mushaf…
          </p>
        </div>
      }
    >
      <MushafView />
    </Suspense>
  );
}
