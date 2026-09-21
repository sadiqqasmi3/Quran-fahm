"use client";

import { useEffect, useRef, useState } from "react";
import { getPdfCoordinateForMushafPage, mushafPageImageUrl } from "@/lib/para-data";

export interface MushafPdfCanvasProps {
  pageNumber: number;
  theme: "parchment" | "sepia" | "night";
  zoom?: number;
  className?: string;
  onRendered?: () => void;
  priority?: boolean;
}

// Global cache for loaded PDF documents (keyed by paraNumber 1..30)
const pdfDocCache = new Map<number, Promise<any>>();

// PDF.js library instance cache
let pdfjsPromise: Promise<any> | null = null;

function loadPdfjs(): Promise<any> {
  if (pdfjsPromise) return pdfjsPromise;
  pdfjsPromise = (async () => {
    // Dynamically import the pre-bundled ESM build from public static assets at runtime
    const dynamicImport = new Function("url", "return import(url)");
    const pdfjs = await dynamicImport("/pdfjs/pdf.min.mjs");
    if (pdfjs.GlobalWorkerOptions) {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
    }
    return pdfjs;
  })();
  return pdfjsPromise;
}

function getCachedPdfDoc(paraNumber: number, pdfUrl: string): Promise<any> {
  let docPromise = pdfDocCache.get(paraNumber);
  if (!docPromise) {
    docPromise = (async () => {
      const pdfjs = await loadPdfjs();
      const loadingTask = pdfjs.getDocument({
        url: pdfUrl,
        cMapUrl: "/pdfjs/cmaps/",
        cMapPacked: true,
      });
      return loadingTask.promise;
    })();
    pdfDocCache.set(paraNumber, docPromise);
  }
  return docPromise;
}

export function MushafPdfCanvas({
  pageNumber,
  theme,
  zoom = 1,
  className = "",
  onRendered,
  priority = false,
}: MushafPdfCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Coordinate in Para PDF
  const { paraNumber, pdfPageNumber, pdfUrl } = getPdfCoordinateForMushafPage(pageNumber);
  const fallbackImageUrl = mushafPageImageUrl(pageNumber);

  useEffect(() => {
    let isCancelled = false;

    async function renderPage() {
      try {
        // Cancel any pending render task for this canvas
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {
            // Task cancellation is safe to ignore
          }
          renderTaskRef.current = null;
        }

        const doc = await getCachedPdfDoc(paraNumber, pdfUrl);
        if (isCancelled) return;

        const page = await doc.getPage(pdfPageNumber);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        // High-DPI crisp vector scaling (Retina / 2x-3x quality)
        const dpr = typeof window !== "undefined" ? Math.max(2, window.devicePixelRatio || 2) : 2;
        // Scale to achieve ~1800-2400px width for razor-sharp diacritics
        const scale = dpr * Math.max(1, zoom) * 1.6;
        const viewport = page.getViewport({ scale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;

        const renderContext = {
          canvasContext: ctx,
          viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        if (isCancelled) return;

        setIsRendered(true);
        setHasError(false);
        onRendered?.();
      } catch (err: any) {
        if (err?.name === "RenderingCancelledException") {
          return;
        }
        // Fallback to high-res WebP image
        setHasError(true);
      }
    }

    void renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // Ignored
        }
      }
    };
  }, [paraNumber, pdfPageNumber, pdfUrl, zoom, onRendered]);

  // Theme-specific CSS filter
  const themeFilterClass =
    theme === "night"
      ? "invert-[0.92] hue-rotate-180 brightness-95 contrast-125"
      : theme === "sepia"
        ? "sepia-[0.25] contrast-[1.03]"
        : "";

  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
      {/* Instant WebP preview image (shown while canvas renders or on fallback) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={fallbackImageUrl}
        alt={`Mushaf Page ${pageNumber}`}
        className={`block max-h-[calc(100dvh-10rem)] w-auto object-contain transition-opacity duration-300 ${
          isRendered && !hasError ? "opacity-0 absolute inset-0 pointer-events-none" : "opacity-100"
        } ${themeFilterClass}`}
        draggable={false}
        loading={priority ? "eager" : "lazy"}
      />

      {/* Vector-sharp High-DPI Canvas */}
      <canvas
        ref={canvasRef}
        className={`block max-h-[calc(100dvh-10rem)] w-auto object-contain transition-opacity duration-300 ${
          isRendered && !hasError ? "opacity-100" : "opacity-0 absolute pointer-events-none"
        } ${themeFilterClass}`}
      />
    </div>
  );
}
