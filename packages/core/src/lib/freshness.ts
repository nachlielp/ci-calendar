/**
 * How long fetched data counts as fresh: event data changes a few times a
 * day, so after 5 minutes a query is revalidated when the app becomes
 * visible again (the public window, shared links, the profile, personal
 * and admin pages alike).
 */
export const STALE_MS = 5 * 60 * 1000
