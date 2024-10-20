# [CI Calendar](https://ci.nachli.com/)

## Introduction

This app is a work in progress, attempting, together with the [Israeli Contact Improve org](https://www.contactil.org/amutah), to solve the Israeli Contact Improv community's need for a calendar that is easy to use and navigate.

## Features

### Users

-   The app is a PWA, installable to the home screen on iOS and Android and enabling push notifications regarding upcoming events
-   List and calendar view of upcoming event previews by date
-   Events can be filtered by region and type (workshop, jame, etc.)
-   Event previews open to a modal on desktop, and a side page (drawer) on mobile, containing full details, linke to share, and google maps link (maps and share in PWA only)
-   Users can set notifications for new events of selected Teachers and Organizers (in PWA only)
-   Users can set default filters for event list
-   Users can submit support tickets and ask to be configerd as teachers or organizers

### Teachers and Organizers

-   Can add new events to the calendar
-   Can edit and delete events
-   Can edit their profile and settings
-   Can create templates for their events, and use them to create new events

### Admins

-   Can add and remove teachers and organizers
-   Can edit all events
-   Can manage and respond to support tickets

## Tech Stack

-   React
-   TypeScript
-   Supabase
-   Firebase Cloud Messaging
-   Ant Design
-   Vercel

## Prerequisites

-   Node.js
-   Supabase Account (for database)
-   Firebase Console with Cloud Messaging enabled (for push notifications)
-   Vercel Account (for deployment)
-   Google Maps API Key (For geocoding event locations)
-   Cloudnary Account (For Teacher and Organizer profile images hosting)

## Environment Variables

VITE_BRANCH
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_API_KEY
VITE_VAPID_PUBLIC_FIREBASE_KEY
VITE_SUPABASE_ANON_KEY
VITE_SUPABASE_URL
VITE_GOOGLE_MAPS_API_KEY

VITE_CLOUDINARY_CLOUD_NAME
VITE_CLOUDINARY_UPLOAD_PRESET
VITE_CLOUDINARY_API_KEY
VITE_CLOUDINARY_API_SECRET
VITE_CLOUDINARY_FOLDER
