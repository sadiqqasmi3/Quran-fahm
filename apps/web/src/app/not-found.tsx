import { BookOpenText } from "lucide-react";
import Link from "next/link";
import { Brand } from "@/components/brand";

export default function NotFound() {
  return (
    <main id="main-content" className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="max-w-md text-center">
        <div className="flex justify-center">
          <Brand />
        </div>
        <BookOpenText
          className="mx-auto mt-12 text-muted"
          aria-hidden="true"
          size={36}
          strokeWidth={1.5}
        />
        <h1 className="mt-5 text-3xl font-semibold tracking-[-0.035em]">This page is not here.</h1>
        <p className="mt-3 leading-7 text-muted">
          Return to the reader or choose another part of Quran Feham.
        </p>
        <Link
          href="/quran"
          className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-action px-5 font-semibold text-on-action hover:bg-action-hover"
        >
          Open the Quran
        </Link>
      </div>
    </main>
  );
}
