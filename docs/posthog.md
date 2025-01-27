### Get the total number of views for each page in given time period

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
  AND timestamp >= '2025-01-01'
  AND timestamp <= '2025-01-31'
GROUP BY clean_url
ORDER BY view_count DESC
```
