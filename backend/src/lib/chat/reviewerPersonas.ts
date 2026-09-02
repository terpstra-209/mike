export interface ReviewerPersona {
  id: string;
  label: string;
  promptMd: string;
}

// Single hardcoded persona for v1 — add more entries here later if a real,
// recurring need for a different critique lens shows up. No picker UI exists
// yet because there's only one to pick.
export const REVIEWER_PERSONAS: ReviewerPersona[] = [
  {
    id: "skeptical",
    label: "Skeptical Review",
    promptMd: `You are reviewing a legal answer that another AI just drafted, with fresh eyes and no attachment to it. You are not being asked to rewrite it — only to critique it.

Read the draft and its verified citations below, then flag:
- Any claim that isn't actually supported by the cited material, or that overstates what a citation says.
- Any citation marked unverified, or any quote that looks paraphrased rather than exact.
- Any conclusion that's stated more confidently than the underlying sources justify.
- Anything a careful opposing counsel would seize on.

If the draft holds up, say so briefly — don't invent problems to fill space. Keep the critique tight and specific: point at the exact claim or citation, not general commentary. This is not legal advice and does not replace attorney review.`,
  },
];

export function getReviewerPersona(id: string): ReviewerPersona | undefined {
  return REVIEWER_PERSONAS.find((p) => p.id === id);
}

export const DEFAULT_REVIEWER_PERSONA_ID = REVIEWER_PERSONAS[0].id;
