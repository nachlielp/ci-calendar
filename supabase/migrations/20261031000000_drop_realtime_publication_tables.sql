-- Take the app's tables out of Supabase Realtime (spec #34, cutover). NOT
-- APPLIED: apply by hand (SQL editor) after review; nothing runs migrations.
--
-- APPLY ONLY AFTER THE NEW CLIENT IS LIVE (docs/cutover.md). The old client
-- opens a realtime channel on these tables for every signed-in user (its
-- usersService.subscribeToUser and requestsService); the new one never does.
-- While the old client is still deployed, or while installed apps may still
-- run it, dropping them only stops its live updates (it still loads and
-- saves), but there is no reason to rush: do it once the new client is
-- serving production. Nothing else uses the publication: the separate
-- notifications/WhatsApp server is not in use.
--
-- The tables are the ones the old client subscribed to: users, ci_events,
-- requests, public_bio, templates. Each is dropped only if it is in the
-- publication, so this is safe to re-run and to run when some were never
-- added. Removing a table from the publication changes no data, policy or
-- grant; it only stops Postgres from streaming its changes to Realtime.
--
-- Check first, and after (the same query should then list none of them;
-- anything else listed is not the app's, so look before removing it):
--   select schemaname, tablename from pg_publication_tables
--   where pubname = 'supabase_realtime' order by 1, 2;
--
-- To undo for one table: alter publication supabase_realtime add table
-- public.<table>;

do $$
declare
    t text;
begin
    -- A FOR ALL TABLES publication can't drop single tables (Supabase's
    -- default is a list; someone would have changed it on purpose).
    if exists (
        select 1 from pg_publication
        where pubname = 'supabase_realtime' and puballtables
    ) then
        raise exception 'supabase_realtime is FOR ALL TABLES; change it by hand';
    end if;

    foreach t in array array[
        'users',
        'ci_events',
        'requests',
        'public_bio',
        'templates'
    ]
    loop
        if exists (
            select 1
            from pg_publication_tables
            where pubname = 'supabase_realtime'
                and schemaname = 'public'
                and tablename = t
        ) then
            execute format(
                'alter publication supabase_realtime drop table public.%I',
                t
            );
            raise notice 'removed public.% from supabase_realtime', t;
        else
            raise notice 'public.% was not in supabase_realtime', t;
        end if;
    end loop;
end
$$;
