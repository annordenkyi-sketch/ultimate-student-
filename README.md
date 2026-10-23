# Ultimate Student

Frontend MVP of **Ultimate Student**, a digital companion app for university
students, built for IID Global.

Students sign in, pick their profile (student type, living situation,
interests), and land on a personalised home with announcements, deadlines,
events, section shortcuts and saved items. Six themed sections cover
Academic life, Campus map, Accommodation, Student services, Social life
and Opportunities.

## Stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** with a brand palette (indigo primary · coral accent)
- **React Router** v6 for routing
- **Framer Motion** for subtle entrance / stagger / page animations
- **lucide-react** for all icons
- State lives in React Context (`useProfile`, `useSaved`, `useChecklist`,
  `useNotifications`, `useToast`)
- Data is read through a single `dataService` abstraction so the mock can be
  swapped for a real API in one file

## Prerequisites

- Node 18 or newer
- npm (comes with Node) · or any compatible package manager

## Install and run

```bash
npm install          # install dependencies
npm run dev          # start Vite dev server on http://localhost:5173
npm run build        # production build to dist/
npm run preview      # preview the production build locally
npm run lint         # TypeScript check (tsc --noEmit)
```

## Folder structure

```
src/
  app/                  layout shell (Sidebar, TopBar, AppShell, routes, providers)
  components/           shared primitives (Motion, SearchBar, ListItem,
                        ActionButton, EmptyState, LoadingState, ...)
  data/
    types.ts            core TypeScript types
    service.ts          single swap-point for real APIs
    mocks/              one file per section + announcements, deadlines,
                        events, notifications, checklist
  features/
    welcome/            marketing cover with campus mosaic
    login/              Log in + Forgot password
    onboarding/         Account → Student type → Living & interests → Done
                        (shared layout, shared Draft context, interests.ts)
    home/               personalised home with 6 content blocks
    sections/           mobile "Sections" index
    section/            generic SectionListPage used by Social + Opportunities
    academic/           custom AcademicPage (calendar, courses, exams, ...)
    navigation/         custom NavigationPage (map, geolocation, places)
    accommodation/      custom AccommodationPage (filters, hostels)
    services/           custom ServicesPage (no decorative SVGs)
    search/             cross-section search results
    saved/              saved items + orientation checklist
    notifications/      alerts feed
    profile/            profile + sign out
    details/            shared details template per section item
    legal/              placeholder Terms / Privacy pages
  hooks/                useProfile, useSaved, useChecklist,
                        useNotifications, useToast
  lib/                  sectionConfig, images (Unsplash URLs + credits),
                        auth (mock), highlight, format, storage
  styles/               Tailwind entry + base styles
```

## Routes

| Route                              | Screen                       |
| ---------------------------------- | ---------------------------- |
| `/welcome`                         | Welcome cover                |
| `/login`                           | Log in                       |
| `/login/forgot`                    | Forgot password              |
| `/onboarding/account`              | Create account               |
| `/onboarding/type`                 | Student type (slideshow)     |
| `/onboarding/living`               | Living & interests           |
| `/onboarding/done`                 | Account ready                |
| `/legal/terms` · `/legal/privacy`  | Legal placeholders           |
| `/`                                | Home (3-col on desktop)      |
| `/search?q=`                       | Cross-section search         |
| `/sections`                        | Section index (mobile tab)   |
| `/section/academic`                | Academic (custom page)       |
| `/section/navigation`              | Campus map (custom page)     |
| `/section/accommodation`           | Accommodation (filters page) |
| `/section/services`                | Services (custom page)       |
| `/section/social`                  | Social life (shared list)    |
| `/section/opportunities`           | Opportunities (shared list)  |
| `/section/:sectionId/:itemId`      | Shared details page          |
| `/saved`                           | Saved + orientation checklist|
| `/notifications`                   | Notifications feed           |
| `/profile`                         | Profile + sign out           |

Routes under the AppShell redirect to `/welcome` until a profile exists in
`localStorage`.

## Responsive layout

- **Mobile (<1024px)** — bottom tab bar (Home · Search · Sections · Saved · Profile)
- **Desktop (≥1024px)** — fixed left sidebar + sticky top bar (wide search +
  notifications bell + profile avatar); content centred at `max-w-[1200px]`

## Swapping mock data for real APIs

**Every data read goes through `src/data/service.ts`.** Replace each method
body with `fetch(...)` and leave the signatures the same.

Methods: `getSection(id)` · `getItem(section, id)` · `getAnnouncements(profile)` ·
`getDeadlines()` · `getEventsThisWeek()` · `getNotifications()` ·
`search(query)` · `getItemsByIds([{section, itemId}])`.

Mock authentication lives in `src/lib/auth.ts` — `auth.signIn`,
`auth.signUp`, `auth.requestPasswordReset`. Same pattern: swap bodies for
real `fetch` calls when the backend is ready.

## Data persistence

The app keeps four things in `localStorage`:

| Key                          | Purpose                   |
| ---------------------------- | ------------------------- |
| `us.profile`                 | Student profile           |
| `us.saved`                   | Saved item references     |
| `us.checklist`               | Orientation checklist     |
| `us.notifications.read`      | IDs of read notifications |

To reset the app for testing: open DevTools → Application → Local Storage →
clear.

## Accessibility baseline

- Semantic landmarks (`<header>`, `<main>`, `<nav>`), skip-link
- All form inputs labelled; search inputs use `role="search"`
- Visible focus ring (`:focus-visible`); keyboard nav throughout
- `aria-pressed` on toggles, `aria-current` on step indicators and active tabs
- `aria-live` on toasts and running counters
- Reduced motion respected — transforms collapse to opacity-only

## What's intentionally out of scope

- Real authentication (sign-in is mocked)
- Push notifications
- Offline mode / service worker
- Native maps SDK (Campus map uses an illustrative SVG; "Get directions"
  opens Google Maps in a new tab)
- Submitting hostel reviews (reviews are read-only mock)
- Payments
- Analytics

## Credits

Photography uses free-license Unsplash photos. Each image is attributed in
`src/lib/images.ts` (`ALL_CREDITS` export). A `/profile/credits` route to
surface these in-app is planned.
