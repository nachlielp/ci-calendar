# Performance baseline (spec #34)

The rewrite is judged against these numbers, not against estimates. Re-run with
`npm run build && npm run check:bundle` (needs `build.manifest`, which the old
client lacks, so use `npx vite build --manifest` there).

## Initial JavaScript for `/` (gzip)

| Client                                | Initial JS | Measured   |
| ------------------------------------- | ---------- | ---------- |
| Old client (`develop` @ `447211c2`)   | 568.7 KB   | 2026-10-30 |
| Rewrite, walking skeleton (`rewrite`) | 113.2 KB   | 2026-10-30 |
| Limit enforced in CI (`bundleBudget`) | 150 KB     |            |

Old client breakdown: app entry 223.8 KB, antd (`vendor-ui`) 285.1 KB, MobX
(`vendor-state`) 15.8 KB, `@supabase/supabase-js` incl. realtime
(`vendor-data`) 44.0 KB. Its heaviest lazy pages: manage-all-events and
manage-my-events, ~60 KB each on top.

## Public calendar payload

The 90-day public window (visible events, trimmed columns) was 25 events,
54 KB raw / 6.3 KB gzip on 2026-10-30 (30 days: 13 events, 4.9 KB gzip), so it
loads in a single request.

## Field data (Vercel Speed Insights)

Not yet recorded. Needs the Vercel dashboard: copy the p75 LCP, INP, CLS and
FCP for `/` on production (www.ci-events.org) here before cutover.
