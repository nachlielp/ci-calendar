-- Deleting a template keeps the events made from it (spec #34, maintainer
-- decision 2026-10-31). APPLIED to production by hand on 2026-10-31.
--
-- `ci_events.source_template_id`'s foreign key cascades, so deleting a
-- template deletes every event made from it (about half of all events
-- reference one). With `on delete set null` the events stay and only lose
-- the link. The client already unlinks the events itself before deleting a
-- template, and deletes the upcoming ones only when the user asks, so it
-- doesn't depend on this; the migration makes a delete from anywhere else
-- (the dashboard, SQL) keep the events too.
--
-- Check first (`c` = cascade, `n` = set null):
--   select confdeltype from pg_constraint
--   where conname = 'ci-events_source_template_id_fkey';
-- After: `n`.

alter table public.ci_events
    drop constraint if exists "ci-events_source_template_id_fkey",
    add constraint "ci-events_source_template_id_fkey"
        foreign key (source_template_id)
        references public.templates (id)
        on delete set null;
