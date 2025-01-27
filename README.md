# [CI Calendar](https://ci-events.org/)

## Introduction

This app is a work in progress, attempting, together with the [Israeli Contact Improve org](https://www.contactil.org/amutah), to solve the Israeli Contact Improv community's need for a calendar that is easy to use and navigate.

-   [App walkthrough video](https://youtu.be/au4L1sRE46w)
-   [Notifications Server](https://github.com/contactil/ci-calendar-server) is a separate project, and is not included in this repository.

## Features

### Users

-   The app is a PWA, installable to the home screen on iOS and Android devices, and enabling push notifications regarding upcoming events
-   List and calendar view of upcoming event previews by date
-   Events can be filtered by region and type (workshop, jame, etc.)
-   Event previews open to a modal on desktop, and a side page (drawer) on mobile, containing full details, link to share, add to calendar button, and google maps link (maps and share in PWA only)
-   Users can set notifications for new events of selected Teachers and Organizers (in PWA only)
-   Users can set alerts for events that are starting soon (in PWA only)
-   Users can set default filters for event list

### Teachers and Organizers

-   Can add new events to the calendar, as a single event or as a recurring event
-   Can edit and delete their events, and batch edit recurring events
-   Can edit their profile
-   Can create templates for their events, and use them to create new events

### Admins

-   Can add and remove teachers and organizers
-   Can edit all events
-   Can manage and respond to support tickets

## Tech Stack

-   React
-   TypeScript
-   MobX
-   Supabase
-   Firebase Cloud Messaging
-   Ant Design
-   Vercel
-   Google Maps API
-   PostHog
-   Sentry

## Prerequisites

-   Node.js
-   Supabase Account (for database)
-   Firebase Console with Cloud Messaging enabled (for push notifications)
-   Vercel Account (for deployment)
-   Google Maps API Key (For geocoding event locations)
-   PostHog Account (For analytics)
-   Sentry Account (For error tracking)

## Environment Variables

-   VITE_BRANCH
-   VITE_FIREBASE_APP_ID
-   VITE_FIREBASE_MESSAGING_SENDER_ID
-   VITE_FIREBASE_STORAGE_BUCKET
-   VITE_FIREBASE_PROJECT_ID
-   VITE_FIREBASE_AUTH_DOMAIN
-   VITE_FIREBASE_API_KEY
-   VITE_VAPID_PUBLIC_FIREBASE_KEY
-   VITE_SUPABASE_ANON_KEY
-   VITE_SUPABASE_URL
-   VITE_GOOGLE_MAPS_API_KEY
-   VITE_SUPABASE_STORAGE_BUCKET
-   VITE_SUPABASE_BIO_STORAGE_PATH
-   VITE_SUPABASE_BIO_STORAGE_PUBLIC_URL
-   VITE_POSTHOG_API_KEY
-   VITE_SENTRY_AUTH_TOKEN
-   VITE_SENTRY_PROJECT
-   VITE_SENTRY_ORG

## Database Schema

-   [Database Schema](./docs/database-schema.md)
-   [Database Functions](./docs/database-functions.md)

## Harvesting Analytics Data

-   [PostHog](./docs/posthog.md)
