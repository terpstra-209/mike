import { describe, expect, it, vi, beforeEach } from "vitest";

const { completeText } = vi.hoisted(() => ({
  completeText: vi.fn(),
}));

vi.mock("../../llm", () => ({ completeText }));

import { runReviewerPass } from "../reviewerPass";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("runReviewerPass", () => {
  it("skips without calling the model when no reviewer model is configured", async () => {
    const result = await runReviewerPass({
      draftText: "The contract is enforceable.",
      citations: [],
      model: null,
    });

    expect(result).toEqual(
      expect.objectContaining({ ok: false, reason: "no_model_configured" }),
    );
    expect(completeText).not.toHaveBeenCalled();
  });

  it("returns the critique text on success", async () => {
    completeText.mockResolvedValue("  Citation [1] is unverified.  ");

    const result = await runReviewerPass({
      draftText: "The contract is enforceable.",
      citations: [{ verified: false, quote: "enforceable" }],
      model: "claude-fable-5",
    });

    expect(result).toEqual({
      ok: true,
      personaId: "skeptical",
      personaLabel: "Skeptical Review",
      text: "Citation [1] is unverified.",
    });
    expect(completeText).toHaveBeenCalledWith(
      expect.objectContaining({ model: "claude-fable-5" }),
    );
  });

  it("degrades to skipped instead of throwing when the provider call fails", async () => {
    completeText.mockRejectedValue(new Error("provider unavailable"));

    const result = await runReviewerPass({
      draftText: "The contract is enforceable.",
      citations: [],
      model: "claude-fable-5",
    });

    expect(result).toEqual(
      expect.objectContaining({ ok: false, reason: "provider_error" }),
    );
  });

  it("degrades to skipped on an empty model response", async () => {
    completeText.mockResolvedValue("   ");

    const result = await runReviewerPass({
      draftText: "The contract is enforceable.",
      citations: [],
      model: "claude-fable-5",
    });

    expect(result).toEqual(
      expect.objectContaining({ ok: false, reason: "empty_response" }),
    );
  });
});
