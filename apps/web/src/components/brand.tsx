import { BookOpenText } from "lucide-react";
import Link from "next/link";

export function Brand({ compact = false, href = "/" }: { compact?: boolean; href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-3 rounded-lg text-ink no-underline"
      aria-label="Quran Feham home"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-action text-on-action shadow-[inset_0_0_0_1px_rgb(255_255_255/0.18)]">
        <BookOpenText aria-hidden="true" size={21} strokeWidth={1.8} />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-[1.05rem] font-semibold tracking-[-0.02em]">Quran Feham</span>
          <span className="font-urdu mt-1 block text-[0.76rem] text-muted" lang="ur" dir="rtl">
            قرآن فہم
          </span>
        </span>
      )}
    </Link>
  );
}
