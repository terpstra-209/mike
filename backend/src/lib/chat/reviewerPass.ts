import { completeText, type UserApiKeys } from "../llm";
import {
  DEFAULT_REVIEWER_PERSONA_ID,
  getReviewerPersona,
} from "./reviewerPersonas";

export type ReviewerPassResult =
  | { ok: true; personaId: string; personaLabel: string; text: string }
  | { ok: false; personaId: string; personaLabel: string; reason: string };

function summarizeCitations(citations: unknown[]): string {
  if (!citations.length) return "(no citations in this draft)";
  return citations
    .map((c, i) => {
      const rec = c as Record<string, unknown>;
      const verified = rec.verified === true ? "verified" : "UNVERIFIED";
      const quote =
        typeof rec.quote === "string"
          ? rec.quote
          : typeof rec.source_excerpt === "string"
            ? rec.source_excerpt
            : "(no quote text)";
      return `[${i + 1}] (${verified}) "${quote}"`;
    })
    .join("\n");
}

// Runs one additional, single-shot LLM call that reads the finished draft +
// its already-verified citations and critiques them. Never throws — a
// reviewer failure (no model configured, provider error) degrades to a
// skipped result so it can never turn a successful chat turn into an error.
export async function runReviewerPass(params: {
  draftText: string;
  citations: unknown[];
  model: string | null;
  apiKeys?: UserApiKeys;
  personaId?: string;
}): Promise<ReviewerPassResult> {
  const personaId = params.personaId ?? DEFAULT_REVIEWER_PERSONA_ID;
  const persona = getReviewerPersona(personaId);
  if (!persona) {
    return {
      ok: false,
      personaId,
      personaLabel: personaId,
      reason: "unknown_persona",
    };
  }
  if (!params.model) {
    return {
      ok: false,
      personaId,
      personaLabel: persona.label,
      reason: "no_model_configured",
    };
  }

  try {
    const text = await completeText({
      model: params.model,
      systemPrompt: persona.promptMd,
      user: `--- DRAFT ---\n${params.draftText}\n\n--- CITATIONS ---\n${summarizeCitations(
        params.citations,
      )}`,
      maxTokens: 1024,
      apiKeys: params.apiKeys,
    });
    const trimmed = text.trim();
    if (!trimmed) {
      return {
        ok: false,
        personaId,
        personaLabel: persona.label,
        reason: "empty_response",
      };
    }
    return { ok: true, personaId, personaLabel: persona.label, text: trimmed };
  } catch {
    return {
      ok: false,
      personaId,
      personaLabel: persona.label,
      reason: "provider_error",
    };
  }
}
