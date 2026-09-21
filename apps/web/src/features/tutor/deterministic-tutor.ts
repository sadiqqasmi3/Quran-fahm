import { findLearningWord, tokenizeArabic } from "../../lib/prototype-learning-data";

export type TutorReplyKind =
  | "translation-help"
  | "word-by-word"
  | "root"
  | "grammar"
  | "refusal"
  | "guidance";

export interface TutorVerseContext {
  arabic: string;
  translation: string | undefined;
  translationName: string;
}

export interface TutorReply {
  kind: TutorReplyKind;
  label: string;
  text: string;
}

const scholarlyTerms = [
  "تفسیر",
  "tafsir",
  "حنفی",
  "hanafi",
  "حکم",
  "فتوی",
  "fatwa",
  "حلال",
  "halal",
  "حرام",
  "haram",
];

export function answerDeterministicTutor(question: string, context: TutorVerseContext): TutorReply {
  const normalizedQuestion = question.trim().toLocaleLowerCase();
  const words = tokenizeArabic(context.arabic).map((token) => ({
    raw: token.raw,
    match: findLearningWord(token.raw),
  }));
  const known = words.filter((word) => word.match !== null);

  if (scholarlyTerms.some((term) => normalizedQuestion.includes(term))) {
    return {
      kind: "refusal",
      label: "Source boundary",
      text:
        "یہ سوال scholarly interpretation یا دینی حکم مانگتا ہے۔ Quran Feham میں ابھی reviewed tafsir یا Hanafi source مربوط نہیں، اس لیے میں غیر مستند جواب نہیں بناؤں گا۔\n\n" +
        (context.translation
          ? `منتخب ${context.translationName} ترجمہ:\n${context.translation}`
          : "اس وقت منتخب ترجمہ بھی دستیاب نہیں ہے۔"),
    };
  }

  if (normalizedQuestion.includes("root") || normalizedQuestion.includes("جذر")) {
    return {
      kind: "root",
      label: "Reviewed learner roots",
      text: known.length
        ? known
            .map(
              ({ raw, match }) =>
                `${raw} → ${match?.root ?? "root اس prototype pack میں درج نہیں"} (${match?.urdu})`,
            )
            .join("\n")
        : "اس آیت کے الفاظ ابھی reviewed prototype root pack میں موجود نہیں۔ میں root guess نہیں کروں گا۔",
    };
  }

  if (
    normalizedQuestion.includes("word by word") ||
    normalizedQuestion.includes("لفظ") ||
    normalizedQuestion.includes("word-by-word")
  ) {
    return {
      kind: "word-by-word",
      label: "Reviewed learner glosses",
      text: words
        .map(({ raw, match }) => `${raw} → ${match?.urdu ?? "reviewed gloss ابھی available نہیں"}`)
        .join("\n"),
    };
  }

  if (
    normalizedQuestion.includes("grammar") ||
    normalizedQuestion.includes("گرامر") ||
    normalizedQuestion.includes("نحو") ||
    normalizedQuestion.includes("صرف") ||
    normalizedQuestion.includes("اعراب")
  ) {
    return {
      kind: "grammar",
      label: "Prototype grammar tags",
      text: known.length
        ? known
            .map(
              ({ raw, match }) =>
                `${raw} → ${match?.pos ?? "—"}${match?.lemma ? ` · lemma: ${match.lemma}` : ""}`,
            )
            .join("\n")
        : "اس آیت کے لیے reviewed grammar tags ابھی available نہیں۔ Quran Feham grammar invent نہیں کرے گا۔",
    };
  }

  if (
    normalizedQuestion.includes("آسان") ||
    normalizedQuestion.includes("سمجھ") ||
    normalizedQuestion.includes("meaning") ||
    normalizedQuestion.includes("translate") ||
    normalizedQuestion.includes("ترجم")
  ) {
    const learnerHelp = known.length
      ? known.map(({ raw, match }) => `${raw} = ${match?.urdu}`).join("، ")
      : "اس آیت کے لیے reviewed learner gloss ابھی محدود ہے۔";
    return {
      kind: "translation-help",
      label: `${context.translationName} translation + learner help`,
      text: context.translation
        ? `منتخب نامزد ترجمہ:\n${context.translation}\n\nسمجھنے کی لفظی مدد:\n${learnerHelp}\n\nنوٹ: لفظی مدد تفسیر نہیں ہے۔`
        : `منتخب ترجمہ دستیاب نہیں۔\n\nمحدود لفظی مدد:\n${learnerHelp}`,
    };
  }

  return {
    kind: "guidance",
    label: "Tutor scope",
    text: "میں اس منتخب آیت کے لیے آسان اردو، word-by-word، reviewed roots اور prototype grammar tags دکھا سکتا ہوں۔ تفسیر یا دینی حکم کے لیے reviewed scholarly source درکار ہوگا۔",
  };
}
