import { describe, expect, it } from "vitest";
import { answerDeterministicTutor } from "./deterministic-tutor";

const context = {
  arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
  translation: "سب تعریف اللہ ہی کے لیے ہے جو تمام جہانوں کا پروردگار ہے",
  translationName: "Jalandhry",
};

describe("deterministic Quran tutor", () => {
  it("uses only reviewed learner glosses for word-by-word help", () => {
    const answer = answerDeterministicTutor("Word by word سمجھائیں", context);
    expect(answer.kind).toBe("word-by-word");
    expect(answer.text).toContain("الْحَمْدُ → تمام تعریف");
    expect(answer.text).toContain("رَبِّ → رب، پرورش کرنے والا");
  });

  it("shows known roots without guessing absent roots", () => {
    const answer = answerDeterministicTutor("root کیا ہے؟", context);
    expect(answer.kind).toBe("root");
    expect(answer.text).toContain("ح م د");
    expect(answer.text).toContain("root اس prototype pack میں درج نہیں");
  });

  it.each(["تفسیر بتائیں", "Hanafi حکم کیا ہے؟", "Is this halal or haram?"])(
    "refuses unsourced scholarly request: %s",
    (question) => {
      const answer = answerDeterministicTutor(question, context);
      expect(answer.kind).toBe("refusal");
      expect(answer.text).toContain("غیر مستند جواب نہیں بناؤں گا");
      expect(answer.text).toContain(context.translation);
    },
  );
});
