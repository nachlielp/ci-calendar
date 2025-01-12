PostHog PageView

```
SELECT
    splitByString('?',
        replaceRegexpOne(
            replaceRegexpOne(
                ifNull(properties.$current_url, ''),
                '^/', 'site/'
            ),
            '^site/', 'app/'
        )
    )[1] as clean_url,
    COUNT(*) as view_count,
    SUM(COUNT(*)) OVER () as total_views  -- Add total views across all pages
FROM events
WHERE properties.$current_url LIKE '%ci-events.org/event/%'
  AND clean_url != ''
  AND timestamp >= '2025-01-12'
  AND timestamp <= '2025-01-13'
GROUP BY clean_url
ORDER BY view_count DESC
```
