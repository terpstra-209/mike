-- Migration date: 2026-08-30

-- Per-user model preference for the optional post-draft reviewer pass. Null
-- means the feature is unconfigured; the reviewer pass is skipped rather than
-- falling back to the draft's own model, since a model reviewing its own
-- draft shares the same blind spots.
alter table public.user_profiles
  add column if not exists reviewer_model text;
