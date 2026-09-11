import { describe, expect, it, vi } from "vitest";

const getPageMock = vi.fn();

vi.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({
  getDocument: () => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: getPageMock,
    }),
  }),
}));

import { duplicateReadDocumentResult, extractPdfText } from "./documentOps";

describe("extractPdfText", () => {
  it("includes filled AcroForm field values alongside page text", async () => {
    getPageMock.mockResolvedValue({
      getTextContent: () =>
        Promise.resolve({ items: [{ str: "Case No.:" }] }),
      getAnnotations: () =>
        Promise.resolve([
          { fieldName: "CaseNumber", fieldValue: "24CV-1234" },
          { fieldName: "EmptyField", fieldValue: "" },
          { fieldName: undefined, fieldValue: "ignored" },
        ]),
    });

    const text = await extractPdfText(new ArrayBuffer(0));

    expect(text).toContain("Case No.:");
    expect(text).toContain("[Page 1 form fields]");
    expect(text).toContain("CaseNumber: 24CV-1234");
    expect(text).not.toContain("EmptyField");
  });

  it("keeps page text when reading annotations fails", async () => {
    getPageMock.mockResolvedValue({
      getTextContent: () =>
        Promise.resolve({ items: [{ str: "Visible text" }] }),
      getAnnotations: () => Promise.reject(new Error("boom")),
    });

    const text = await extractPdfText(new ArrayBuffer(0));

    expect(text).toContain("Visible text");
    expect(text).not.toContain("form fields");
  });
});

describe("duplicateReadDocumentResult", () => {
  const parsed = () =>
    JSON.parse(
      duplicateReadDocumentResult({
        docLabel: "doc-2",
        documentId: "abc",
        versionId: "v1",
      }),
    ) as Record<string, unknown>;

  it("carries no content key", () => {
    // The regression this guards: prose in "content" — where document text
    // belongs — read as a malfunction. Models re-called read_document, got
    // the same sentence, and looped until the step cap ended the turn. One
    // Gemini turn read a single file 29 times.
    expect(parsed()).not.toHaveProperty("content");
  });

  it("says retrying cannot help, which is what breaks the loop", () => {
    const result = parsed();
    expect(String(result.explanation)).toMatch(/not a truncation/i);
    expect(String(result.next_required_action)).toMatch(
      /Do NOT call read_document for this document again/,
    );
  });

  it("still identifies the document it is standing in for", () => {
    expect(parsed()).toMatchObject({
      ok: true,
      already_read: true,
      doc_id: "doc-2",
      document_id: "abc",
      version_id: "v1",
    });
  });
});
