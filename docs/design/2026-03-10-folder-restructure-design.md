# Folder Restructure — Design Doc

**Date:** 2026-03-10
**Status:** Approved
**Goal:** Restructure the EnviroConnect project for developer experience, scalability, and alignment with modern Next.js/Convex conventions (feature-based colocation).

---

## Principles

- **Colocate by feature domain** — files that change together live together
- **Flat where small, nested where growing** — don't over-nest, but group related files
- **One source of truth** — schema, config, and theme stay at their canonical locations
- **Clean parent directory** — all project assets consolidated inside `enviroconnect/`

---

## 1. Parent Directory Cleanup

Move all loose files from `industrial_network_app/` into `enviroconnect/docs/reference/`:

| Source | Destination |
|--------|------------|
| `project-kickoff.md` | `docs/reference/project-kickoff.md` |
| `claude-code-app-build-guide.md` | `docs/reference/claude-code-app-build-guide.md` |
| `Industrial_Environmental_Webapp.md` | `docs/reference/Industrial_Environmental_Webapp.md` |
| `redesign-mockup/index.html` | `docs/reference/redesign-mockup/index.html` |
| `Design_References & Assets/*` | `docs/reference/assets/*` |

After: parent directory contains only `.claude/` and `enviroconnect/`.

---

## 2. Components — Feature Domain Grouping

Move 22 flat component files into 7 domain folders:

```
components/
├── layout/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── ScrollReveal.tsx
├── shared/
│   ├── ThemeProvider.tsx
│   ├── ThemeToggle.tsx
│   ├── NotificationBell.tsx
│   ├── UserSearch.tsx
│   ├── PdfUpload.tsx
│   ├── PdfPreviewModal.tsx
│   ├── SkeletonCard.tsx
│   └── SkeletonProfile.tsx
├── vendor/
│   └── VendorCard.tsx
├── rfq/
│   ├── RfqCard.tsx
│   └── SkeletonRfq.tsx
├── messaging/
│   ├── ChatIcon.tsx
│   ├── ChatInput.tsx
│   ├── ChatThread.tsx
│   ├── ConversationList.tsx
│   └── NewMessageModal.tsx
├── meetings/
│   ├── MeetingCard.tsx
│   ├── MeetingRequestModal.tsx
│   ├── CalendarLinks.tsx
│   └── TimeSlotPicker.tsx
└── endorsements/
    ├── EndorseButton.tsx
    ├── EndorsementBadge.tsx
    └── EndorsersModal.tsx
```

**Import update:** All `@/components/Foo` → `@/components/<domain>/Foo`. Grep each moved component and update every importing file.

---

## 3. Convex Backend — Feature Domain Folders

Move query/mutation file pairs into domain folders. Config files stay at root.

```
convex/
├── schema.ts             (stays — single source of truth)
├── auth.config.ts        (stays — config)
├── http.ts               (stays — webhook handler)
├── users/
│   └── queries.ts        ← from users.ts
├── vendors/
│   ├── queries.ts        ← from vendors.ts
│   └── mutations.ts      ← from mutations.ts
├── rfq/
│   ├── queries.ts        ← from rfqs.ts
│   └── mutations.ts      ← from rfqMutations.ts
├── meetings/
│   ├── queries.ts        ← from meetings.ts
│   └── mutations.ts      ← from meetingMutations.ts
├── messaging/
│   ├── queries.ts        ← from messaging.ts
│   └── mutations.ts      ← from messagingMutations.ts
└── endorsements/
    ├── queries.ts        ← from endorsements.ts
    └── mutations.ts      ← from endorsementMutations.ts
```

**API path changes:**

| Old | New |
|-----|-----|
| `api.rfqs.*` | `api.rfq.queries.*` |
| `api.rfqMutations.*` | `api.rfq.mutations.*` |
| `api.meetings.*` | `api.meetings.queries.*` |
| `api.meetingMutations.*` | `api.meetings.mutations.*` |
| `api.messaging.*` | `api.messaging.queries.*` |
| `api.messagingMutations.*` | `api.messaging.mutations.*` |
| `api.endorsements.*` | `api.endorsements.queries.*` |
| `api.endorsementMutations.*` | `api.endorsements.mutations.*` |
| `api.vendors.*` | `api.vendors.queries.*` |
| `api.mutations.*` | `api.vendors.mutations.*` |
| `api.users.*` | `api.users.queries.*` |

**Migration:** Move files → `npx convex codegen` → bulk find-and-replace API paths across frontend → `npm run build` to verify.

---

## 4. Docs Directory — Categorized + Archive

```
docs/
├── plans/        ← active/upcoming implementation plans
├── design/       ← active/upcoming design docs
├── archive/      ← completed feature docs (all 12 existing docs)
└── reference/    ← project-level materials (kickoff, build guide, mockups, assets)
```

All 12 existing plan/design docs move to `archive/` (all features shipped).

---

## 5. Cleanup — Remove Unused Starter Assets

Delete unused `create-next-app` SVGs from `public/`:
- `file.svg`
- `globe.svg`
- `next.svg`
- `vercel.svg`
- `window.svg`

---

## 6. Post-Restructure Updates

- **CLAUDE.md** — Update all file path references to reflect new structure
- **MEMORY.md** — Update Key Files section with new paths
- **Verify** — `npm run build` must pass clean before committing

---

## What Stays Unchanged

- `app/` route structure (no page moves)
- `lib/constants.ts`
- `public/fonts/`, `public/images/`
- `middleware.ts`
- `.env.local`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`
- `package.json`, `package-lock.json`

---

## Full Target Structure

```
industrial_network_app/
├── .claude/
└── enviroconnect/
    ├── app/                    (unchanged)
    ├── components/
    │   ├── layout/
    │   ├── shared/
    │   ├── vendor/
    │   ├── rfq/
    │   ├── messaging/
    │   ├── meetings/
    │   └── endorsements/
    ├── convex/
    │   ├── schema.ts
    │   ├── auth.config.ts
    │   ├── http.ts
    │   ├── users/
    │   ├── vendors/
    │   ├── rfq/
    │   ├── meetings/
    │   ├── messaging/
    │   └── endorsements/
    ├── lib/
    │   └── constants.ts
    ├── docs/
    │   ├── plans/
    │   ├── design/
    │   ├── archive/
    │   └── reference/
    ├── public/
    │   ├── fonts/
    │   └── images/
    ├── middleware.ts
    └── CLAUDE.md
```
