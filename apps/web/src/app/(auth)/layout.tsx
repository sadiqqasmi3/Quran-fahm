import type { ReactNode } from "react";
import { Brand } from "@/components/brand";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main
      id="main-content"
      className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(26rem,0.72fr)]"
    >
      <section className="flex min-h-dvh flex-col bg-surface px-5 py-5 sm:px-10 sm:py-8 lg:px-16">
        <Brand />
        <div className="my-auto flex justify-center py-12">{children}</div>
        <p className="text-center text-xs text-muted">
          Your private study history is never part of the public reader.
        </p>
      </section>
      <aside
        className="soft-grid relative hidden overflow-hidden border-l border-line bg-accent-soft lg:grid lg:place-items-center"
        aria-label="Quran reading preview"
      >
        <div className="reading-measure mx-12 rounded-[1.75rem] border border-line bg-surface p-12 shadow-[0_24px_80px_rgb(19_35_28/0.12)]">
          <p className="font-quran text-center text-4xl leading-[2.1] text-ink" lang="ar" dir="rtl">
            اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ
          </p>
          <div className="mx-auto mt-8 h-px w-20 bg-line" />
          <p className="mt-6 text-center text-sm leading-6 text-muted">
            Read with attention. Keep sources visible. Return without losing your place.
          </p>
        </div>
      </aside>
    </main>
  );
}
