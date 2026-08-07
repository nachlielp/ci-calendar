# [CI Calendar](https://ci-events.org/)

## Introduction

This app is a work in progress, attempting, together with the [Israeli Contact Improve org](https://www.contactil.org/amutah), to solve the Israeli Contact Improv community's need for a calendar that is easy to use and navigate.

- [App walkthrough video](https://youtu.be/au4L1sRE46w)

## Features

### Users

- The app is a PWA, installable to the home screen on iOS and Android devices
- List and calendar view of upcoming event previews by date
- Events can be filtered by region and type (workshop, jame, etc.)
- Event previews open to a modal on desktop, and a side page (drawer) on mobile, containing full details, link to share, add to calendar button, and google maps link (maps and share in PWA only)
- Users can set default filters for event list

### Teachers and Organizers

- Can add new events to the calendar, as a single event or as a recurring event
- Can edit and delete their events, and batch edit recurring events
- Can edit their profile
- Can create templates for their events, and use them to create new events

### Admins

- Can add and remove teachers and organizers
- Can edit all events
- Can manage and respond to support tickets

## Tech Stack

- Vite
- React
- TypeScript
- MobX
- Supabase
- Ant Design
- Vercel
- Google Maps API
- PostHog
- Sentry

## Prerequisites

- Node.js
- Supabase Account (for database)
- Vercel Account (for deployment)
- Google Maps API Key (for geocoding event locations)
- PostHog Account (for analytics)
- Sentry Account (for error tracking)

## Environment Variables

Copy [`.env.example`](./.env.example) to `.env` and fill in real values. Every
`VITE_`-prefixed variable is inlined into the public client bundle, so only
values safe to expose in the browser belong there.

### Runtime (client)

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_SUPABASE_STORAGE_BUCKET
- VITE_SUPABASE_BIO_STORAGE_PUBLIC_URL
- VITE_AUTH_KEY_NAME
- VITE_GOOGLE_MAPS_API_KEY
- VITE_PUBLIC_POSTHOG_KEY
- VITE_PUBLIC_POSTHOG_HOST
- VITE_GOOGLE_ANALYTICS_ID
- VITE_SENTRY_DSN
- VITE_BRANCH
- VITE_DISABLE_APP
- VITE_HIDE_EVENTS_FLAG
- VITE_LANGUAGES_TO_SHOW
- VITE_PWA_TEST
- VITE_WHATSAPP_NUMBER

### Build-time only (not shipped to the browser)

- SENTRY_AUTH_TOKEN — enables Sentry release/sourcemap upload; when unset the Sentry build plugin is skipped

## Database Schema

- [Database Schema](./docs/database-schema.md)
- [Database Functions](./docs/database-functions.md)

## Harvesting Analytics Data

- [PostHog](./docs/posthog.md)
