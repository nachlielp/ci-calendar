-- Backfill ci_events_users_junction from the teachers and organisations tagged
-- on each event (spec #34, slice 3).
--
-- The rewritten client embeds tagged teachers' public bios through this
-- junction (ci_events → ci_events_users_junction → public_bio). The legacy
-- client instead matched tag values against the full public-bio list, so
-- events whose junction rows were never written still showed bio links
-- there. A read-only check (2026-10-30) found 66 visible events, dated
-- 2025-02-11 to 2026-03-19, tagging a public bio with no junction row; in the
-- new client their teachers show as plain names instead of opening the bio.
--
-- A tag is `{ "label": ..., "value": ... }` in `segments[].teachers`,
-- `multi_day_teachers` and `organisations` (arrays of json). `value` is a user
-- id when the teacher was tagged, otherwise the typed name or `NON_EXISTENT…`,
-- so tags are matched to `public_bio.user_id` as text: names never match, and
-- nothing is cast. Every bio is linked, as the legacy write path did; whether
-- it is shown is decided when reading (`show_profile = true`).
--
-- Idempotent: only missing (event, user) pairs are inserted, so it can be run
-- again. `id` and `created_at` take their column defaults, as in the legacy
-- inserts. Nothing is deleted.
--
-- Apply by hand (SQL editor); this repo has no migration runner.
--
-- Check before and after (0 after):
--   select count(*) from (<the select below>) as missing;

begin;

insert into public.ci_events_users_junction (ci_event_id, user_id)
select distinct tagged.ci_event_id, bio.user_id
from (
    select event.id as ci_event_id, teacher #>> '{}' as tag_value
    from public.ci_events as event
    cross join lateral unnest(event.segments) as segment
    cross join lateral jsonb_path_query(
        to_jsonb(segment), '$.teachers[*].value'
    ) as teacher
    union
    select event.id, teacher #>> '{}'
    from public.ci_events as event
    cross join lateral unnest(event.multi_day_teachers) as tag
    cross join lateral jsonb_path_query(to_jsonb(tag), '$.value') as teacher
    union
    select event.id, organisation #>> '{}'
    from public.ci_events as event
    cross join lateral unnest(event.organisations) as tag
    cross join lateral jsonb_path_query(to_jsonb(tag), '$.value') as organisation
) as tagged
join public.public_bio as bio on bio.user_id::text = tagged.tag_value
where not exists (
    select 1
    from public.ci_events_users_junction as junction
    where junction.ci_event_id = tagged.ci_event_id
      and junction.user_id = bio.user_id
);

commit;
