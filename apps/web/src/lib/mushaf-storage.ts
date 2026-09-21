import { PARAS, getPara } from "./para-data";

export const MUSHAF_PAGE_STORAGE_KEY = "qf_mushaf_last_page";
export const MUSHAF_PARA_STORAGE_KEY = "qf_mushaf_last_para";
export const MUSHAF_THEME_STORAGE_KEY = "qf_mushaf_theme";
export const MUSHAF_ZOOM_STORAGE_KEY = "qf_mushaf_zoom";
export const MUSHAF_DIRECTION_STORAGE_KEY = "qf_mushaf_direction";

export interface MushafPosition {
  para: number;
  page: number;
}

/**
 * Resolves the initial Mushaf reading position with the following priority:
 * 1. Explicit page passed via props or URL (?page=X).
 * 2. Explicit para passed via props or URL (?para=X).
 * 3. Saved reading position from localStorage (resumes where the user left off).
 * 4. Default start of Mushaf (Para 1, Page 2).
 */
export function resolveInitialMushafPosition(
  propPara?: number,
  propPage?: number,
  storage?: Storage | undefined,
): MushafPosition {
  // 1. Explicit page passed via props or URL (?page=X)
  if (typeof propPage === "number" && propPage >= 2 && propPage <= 611) {
    const foundPara = PARAS.find(
      (p) => propPage >= p.startMushafPage && propPage <= p.endMushafPage,
    );
    return {
      para: foundPara
        ? foundPara.number
        : typeof propPara === "number" && propPara >= 1 && propPara <= 30
          ? propPara
          : 1,
      page: propPage,
    };
  }

  // 2. Explicit para passed via props or URL (?para=X)
  if (typeof propPara === "number" && propPara >= 1 && propPara <= 30) {
    const para = getPara(propPara);
    return {
      para: propPara,
      page: para.startMushafPage,
    };
  }

  // 3. Persistent reading position from localStorage (where user left off)
  const store = storage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
  if (store) {
    try {
      const savedPageStr = store.getItem(MUSHAF_PAGE_STORAGE_KEY);
      if (savedPageStr) {
        const savedPage = Number.parseInt(savedPageStr, 10);
        if (!Number.isNaN(savedPage) && savedPage >= 2 && savedPage <= 611) {
          const foundPara = PARAS.find(
            (p) => savedPage >= p.startMushafPage && savedPage <= p.endMushafPage,
          );
          return {
            para: foundPara ? foundPara.number : 1,
            page: savedPage,
          };
        }
      }

      const savedParaStr = store.getItem(MUSHAF_PARA_STORAGE_KEY);
      if (savedParaStr) {
        const savedPara = Number.parseInt(savedParaStr, 10);
        if (!Number.isNaN(savedPara) && savedPara >= 1 && savedPara <= 30) {
          return {
            para: savedPara,
            page: getPara(savedPara).startMushafPage,
          };
        }
      }
    } catch {
      // Gracefully handle storage restrictions
    }
  }

  // 4. Default start of Mushaf (Para 1, Page 2)
  return { para: 1, page: 2 };
}

/**
 * Saves the current Mushaf reading position into localStorage.
 */
export function saveMushafPosition(
  page: number,
  para: number,
  storage?: Storage | undefined,
): void {
  const store = storage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
  if (!store) return;
  try {
    store.setItem(MUSHAF_PAGE_STORAGE_KEY, String(page));
    store.setItem(MUSHAF_PARA_STORAGE_KEY, String(para));
  } catch {
    // Ignore storage quota errors
  }
}
