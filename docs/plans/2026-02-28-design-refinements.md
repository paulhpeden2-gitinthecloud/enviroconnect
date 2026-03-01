# Design Refinements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Overhaul EnviroConnect's visual design — new fonts, cream/dark mode palette, Cropzen-inspired landing page with hero image + scroll animations, footer, about page, skeleton loaders, and UI polish.

**Architecture:** All changes are frontend-only. New CSS variables in globals.css drive the theme. A ThemeProvider context manages dark mode toggle state and persists to localStorage. framer-motion handles scroll-triggered animations. All new components follow existing patterns (client components with "use client", Tailwind utility classes, Convex queries where needed).

**Tech Stack:** Next.js 14 App Router, React, Tailwind CSS v4, framer-motion, Clerk, Convex

---

## Task 1: Set Up Fonts and Assets

**Files:**
- Create: `public/fonts/ScienceGothic-Regular.ttf`
- Create: `public/fonts/ScienceGothic-Bold.ttf`
- Create: `public/fonts/ScienceGothic-SemiBold.ttf`
- Create: `public/fonts/Electrolize-Regular.ttf`
- Create: `public/images/hero-bg.jpg`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

**Step 1: Extract fonts and copy hero image**

```bash
cd "/Users/blueenvironmental/Documents/ACTIVE WORK/industrial_network_app/enviroconnect"
mkdir -p public/fonts public/images

# Extract Science Gothic — we need Regular, SemiBold, Bold (normal width)
unzip -o "../Science_Gothic.zip" "static/ScienceGothic-Regular.ttf" "static/ScienceGothic-SemiBold.ttf" "static/ScienceGothic-Bold.ttf" -d /tmp/sg
cp /tmp/sg/static/ScienceGothic-Regular.ttf public/fonts/
cp /tmp/sg/static/ScienceGothic-SemiBold.ttf public/fonts/
cp /tmp/sg/static/ScienceGothic-Bold.ttf public/fonts/

# Extract Electrolize
unzip -o "../Electrolize.zip" "Electrolize-Regular.ttf" -d /tmp/el
cp /tmp/el/Electrolize-Regular.ttf public/fonts/

# Copy hero image
cp "../s_donald-travel-5367226_1920.jpg" public/images/hero-bg.jpg
```

**Step 2: Add @font-face declarations and cream/dark mode variables to globals.css**

Replace the entire `app/globals.css` with:

```css
@import "tailwindcss";

/* === Fonts === */
@font-face {
  font-family: "Science Gothic";
  src: url("/fonts/ScienceGothic-Regular.ttf") format("truetype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Science Gothic";
  src: url("/fonts/ScienceGothic-SemiBold.ttf") format("truetype");
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Science Gothic";
  src: url("/fonts/ScienceGothic-Bold.ttf") format("truetype");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Electrolize";
  src: url("/fonts/Electrolize-Regular.ttf") format("truetype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

/* === Light mode (default) === */
:root {
  --background: #F8F6F1;
  --foreground: #1B2A4A;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-navy: #1B2A4A;
  --color-navy-light: #243759;
  --color-green: #2D5F2D;
  --color-green-light: #3a7a3a;
  --color-cream: #F8F6F1;
  --color-cream-dark: #EDE9E0;
  --font-heading: "Science Gothic", system-ui, sans-serif;
  --font-body: "Electrolize", system-ui, sans-serif;
}

/* === Dark mode === */
html.dark {
  --background: #1A1A1A;
  --foreground: #E8E8E8;
  --color-navy: #0F1A2E;
  --color-navy-light: #1B2A4A;
  --color-green: #4A9E4A;
  --color-green-light: #5CB85C;
  --color-cream: #1A1A1A;
  --color-cream-dark: #2A2A2A;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-body);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}
```

**Step 3: Remove the Inter font import from layout.tsx**

In `app/layout.tsx`, remove the `Inter` import from `next/font/google` and the `inter.className` usage. The body font is now set via CSS. Keep the `<html lang="en">` and the rest of the layout intact.

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "EnviroConnect — Environmental Compliance Vendor Directory",
  description: "Discover pre-vetted environmental compliance vendors across the Pacific Northwest.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

Note: `suppressHydrationWarning` on `<html>` is needed because the dark mode class is set client-side before hydration.

**Step 4: Verify fonts load**

Run: `npm run dev`
Open: http://localhost:3000
Expected: Headings render in Science Gothic, body text in Electrolize. Page background is cream (#F8F6F1).

**Step 5: Commit**

```bash
git add public/fonts/ public/images/ app/globals.css app/layout.tsx
git commit -m "feat: add Science Gothic + Electrolize fonts, cream palette, dark mode CSS variables"
```

---

## Task 2: Dark Mode Toggle + ThemeProvider

**Files:**
- Create: `components/ThemeProvider.tsx`
- Create: `components/ThemeToggle.tsx`
- Modify: `app/providers.tsx`
- Modify: `components/Navbar.tsx`

**Step 1: Create ThemeProvider**

Create `components/ThemeProvider.tsx`:

```tsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({ theme: "light", toggleTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    const initial = stored ?? preferred;
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  if (!mounted) return <>{children}</>;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

**Step 2: Create ThemeToggle button**

Create `components/ThemeToggle.tsx`:

```tsx
"use client";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="p-2 rounded-lg text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
    >
      {theme === "light" ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.166.75.75 0 011.067.853A8.5 8.5 0 116.93 1.69a.75.75 0 01.526.314z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zm0 13a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zm-8-5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 012 10zm13 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0115 10zm-2.05-4.95a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 01-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zm-7.07 7.07a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 01-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zm7.07 0a.75.75 0 010 1.06l1.06 1.06a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 00-1.06 0zM5.88 5.05a.75.75 0 010 1.06L4.82 7.17a.75.75 0 01-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zM10 6.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" />
        </svg>
      )}
    </button>
  );
}
```

**Step 3: Wrap Providers with ThemeProvider**

Modify `app/providers.tsx` — wrap existing providers with ThemeProvider:

```tsx
"use client";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ThemeProvider } from "@/components/ThemeProvider";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ClerkProvider>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          {children}
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </ThemeProvider>
  );
}
```

**Step 4: Add ThemeToggle to Navbar**

In `components/Navbar.tsx`, import and add `<ThemeToggle />` between the nav links and the auth buttons.

```tsx
"use client";
import Link from "next/link";
import { useUser, SignInButton, SignOutButton } from "@clerk/nextjs";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const { user, isLoaded } = useUser();
  return (
    <header className="bg-navy text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="font-heading text-xl font-bold tracking-tight">EnviroConnect</Link>
          <nav className="flex items-center gap-4">
            <Link href="/directory" className="text-sm font-medium text-gray-200 hover:text-white transition-colors">
              Find Vendors
            </Link>
            <Link href="/about" className="text-sm font-medium text-gray-200 hover:text-white transition-colors">
              About
            </Link>
            <ThemeToggle />
            {isLoaded && (
              user ? (
                <div className="flex items-center gap-4">
                  <Link href="/dashboard" className="text-sm font-medium text-gray-200 hover:text-white transition-colors">Dashboard</Link>
                  <SignOutButton>
                    <button className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition-colors">Sign Out</button>
                  </SignOutButton>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <SignInButton mode="modal">
                    <button className="text-sm font-medium text-gray-200 hover:text-white transition-colors">Sign In</button>
                  </SignInButton>
                  <Link href="/sign-up" className="text-sm bg-green hover:bg-green-light px-4 py-2 rounded font-medium transition-colors">
                    Get Listed
                  </Link>
                </div>
              )
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
```

**Step 5: Verify dark mode toggle**

Run: `npm run dev`
Open: http://localhost:3000
Expected: Click moon icon → page goes dark, icon switches to sun. Refresh → preference persists.

**Step 6: Commit**

```bash
git add components/ThemeProvider.tsx components/ThemeToggle.tsx app/providers.tsx components/Navbar.tsx
git commit -m "feat: add dark mode toggle with localStorage persistence"
```

---

## Task 3: Install framer-motion

**Step 1: Install**

```bash
cd "/Users/blueenvironmental/Documents/ACTIVE WORK/industrial_network_app/enviroconnect"
npm install framer-motion
```

**Step 2: Create reusable scroll animation wrapper**

Create `components/ScrollReveal.tsx`:

```tsx
"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function ScrollReveal({ children, className, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

**Step 3: Commit**

```bash
git add package.json package-lock.json components/ScrollReveal.tsx
git commit -m "feat: add framer-motion and ScrollReveal component"
```

---

## Task 4: Redesign Landing Page

**Files:**
- Modify: `app/page.tsx` (complete rewrite)

**Step 1: Rewrite the landing page**

Replace `app/page.tsx` with the full redesigned version. Key sections in order:

1. **Hero** — full-width background image (`/images/hero-bg.jpg`) with navy gradient overlay, Science Gothic h1, two CTAs
2. **How It Works** — cream bg, 3 cards with green accent bar + pill step number
3. **Why EnviroConnect** — 2x2 grid of feature cards with inline SVG icons (map-pin, shield, checkmark, handshake)
4. **Services Grid** — 4-col grid with cream bg cards, green hover border
5. **Stats Bar** — navy bg, 4 factual items in a row
6. **Vendor CTA** — navy bg, "Are You a Vendor?" with two lines of text

All sections wrapped in `<ScrollReveal>`. Card grids use staggered delays.

The full JSX is roughly 250 lines. The implementing agent should write it based on the design doc sections + existing page structure, applying:
- `bg-cream` instead of `bg-gray-50`
- `bg-cream-dark` for card borders instead of `border-gray-200`
- `font-heading` class on all headings (maps to Science Gothic via the CSS variable)
- `py-24` on all sections
- `hover:-translate-y-1 hover:shadow-md transition-all duration-200` on interactive cards
- ScrollReveal wrapping each section, with `delay={index * 0.1}` on staggered card children

**Step 2: Verify landing page**

Run: `npm run dev`
Open: http://localhost:3000
Expected: Hero shows Mt. Rainier image behind navy overlay, sections animate in on scroll, cards lift on hover, cream backgrounds throughout.

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: redesign landing page — hero image, scroll animations, new sections"
```

---

## Task 5: Footer Component

**Files:**
- Create: `components/Footer.tsx`
- Modify: `app/layout.tsx`

**Step 1: Create Footer component**

Create `components/Footer.tsx` — 4-column grid layout:
- Column 1: "EnviroConnect" brand (font-heading), tagline, contact email
- Column 2: "Directory" — Browse All, By Service, By Region
- Column 3: "Company" — About, Contact, FAQ
- Column 4: "For Vendors" — Get Listed, Vendor Dashboard, How It Works

Plus a "Legal" row or sub-links: Privacy, Terms (can be placeholder `#` hrefs for now).

Bottom bar: `© 2026 EnviroConnect. All rights reserved.`

Styling:
- `bg-navy text-gray-300`
- Thin green accent line at top: `border-t-2 border-green`
- `font-heading` on brand name and column headers
- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8`
- Padding: `py-16 px-4`

**Step 2: Add Footer to layout.tsx**

In `app/layout.tsx`, import `Footer` and add `<Footer />` after `{children}` inside the `<Providers>` wrapper.

**Step 3: Verify footer**

Run: `npm run dev`
Open: http://localhost:3000
Expected: Footer appears at bottom of every page. Green accent line at top, 4 columns on desktop, stacks on mobile.

**Step 4: Commit**

```bash
git add components/Footer.tsx app/layout.tsx
git commit -m "feat: add multi-column footer to all pages"
```

---

## Task 6: About Page

**Files:**
- Create: `app/about/page.tsx`

**Step 1: Create the about page**

Create `app/about/page.tsx` with four sections, all wrapped in ScrollReveal:

**Mission Section:**
- Cream background, py-24
- Science Gothic h1: "Connecting the Pacific Northwest's Environmental Industry"
- 2-3 paragraphs about the problem and EnviroConnect's solution (can be placeholder copy — the structure matters more than the words)

**Founder/Team Section:**
- Single card with placeholder image area (gray circle), name field, title, short bio
- Use placeholder text: "Your Name", "Founder & CEO", brief description
- Card matches site styling: `bg-white dark:bg-navy-light border border-cream-dark rounded-xl p-8`

**Contact Form:**
- Fields: Name (text), Email (email), Subject (select: General Inquiry, Partnerships, Support, Feedback), Message (textarea)
- "Send Message" button that constructs a `mailto:` link with subject and body from the form fields and opens it
- Green CTA button matching rest of site

**FAQ Accordion:**
- Client component section with useState for open/close per question
- 6 questions from the design doc
- Each: clickable row with question text + chevron SVG that rotates 180deg when open
- Answer expands below with framer-motion AnimatePresence for smooth height animation
- Answers can be placeholder text for now

**Step 2: Verify about page**

Run: `npm run dev`
Open: http://localhost:3000/about
Expected: All four sections render, FAQ accordion opens/closes smoothly, contact form opens mailto on submit, scroll animations work.

**Step 3: Commit**

```bash
git add app/about/page.tsx
git commit -m "feat: add about page with mission, team, contact form, FAQ"
```

---

## Task 7: Skeleton Loaders

**Files:**
- Create: `components/SkeletonCard.tsx`
- Create: `components/SkeletonProfile.tsx`
- Modify: `app/directory/DirectoryClient.tsx`
- Modify: `app/directory/[id]/page.tsx`
- Modify: `app/dashboard/vendor/page.tsx`
- Modify: `app/dashboard/facility/page.tsx`
- Modify: `app/dashboard/page.tsx`

**Step 1: Create SkeletonCard component**

Create `components/SkeletonCard.tsx` — matches VendorCard dimensions:

```tsx
export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-navy-light border border-cream-dark rounded-xl p-6 h-full flex flex-col animate-pulse">
      <div className="h-5 bg-cream-dark rounded w-3/4 mb-2" />
      <div className="h-3 bg-cream-dark rounded w-1/3 mb-4" />
      <div className="space-y-2 flex-1 mb-4">
        <div className="h-3 bg-cream-dark rounded w-full" />
        <div className="h-3 bg-cream-dark rounded w-5/6" />
      </div>
      <div className="flex gap-2 mt-auto">
        <div className="h-6 bg-cream-dark rounded-full w-20" />
        <div className="h-6 bg-cream-dark rounded-full w-16" />
        <div className="h-6 bg-cream-dark rounded-full w-24" />
      </div>
    </div>
  );
}
```

**Step 2: Create SkeletonProfile component**

Create `components/SkeletonProfile.tsx` — matches vendor profile detail layout:

```tsx
export function SkeletonProfile() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8 animate-pulse">
      <div className="md:col-span-2 space-y-8">
        <div><div className="h-6 bg-cream-dark rounded w-1/4 mb-3" /><div className="space-y-2"><div className="h-4 bg-cream-dark rounded w-full" /><div className="h-4 bg-cream-dark rounded w-5/6" /><div className="h-4 bg-cream-dark rounded w-4/6" /></div></div>
        <div><div className="h-6 bg-cream-dark rounded w-1/4 mb-3" /><div className="flex flex-wrap gap-2"><div className="h-8 bg-cream-dark rounded-full w-28" /><div className="h-8 bg-cream-dark rounded-full w-32" /><div className="h-8 bg-cream-dark rounded-full w-24" /></div></div>
      </div>
      <div className="space-y-4">
        <div className="bg-white dark:bg-navy-light rounded-xl p-6 border border-cream-dark"><div className="h-5 bg-cream-dark rounded w-1/2 mb-4" /><div className="space-y-3"><div className="h-3 bg-cream-dark rounded w-full" /><div className="h-3 bg-cream-dark rounded w-3/4" /></div></div>
      </div>
    </div>
  );
}
```

**Step 3: Replace "Loading..." in each file**

- `DirectoryClient.tsx`: replace the "Loading..." div with a grid of 6 `<SkeletonCard />` components
- `[id]/page.tsx`: replace the "Loading..." div with `<SkeletonProfile />`
- `dashboard/vendor/page.tsx`: replace the "Loading..." div with a pulse skeleton for header bar + form outline
- `dashboard/facility/page.tsx`: replace the "Loading..." p tag with a grid of 3 `<SkeletonCard />` components
- `dashboard/page.tsx`: replace the "Loading your dashboard..." with a thin animated progress bar at top

**Step 4: Verify skeletons**

Run: `npm run dev`
Open: http://localhost:3000/directory (before Convex loads)
Expected: 6 pulsing ghost cards visible briefly before real data appears.

**Step 5: Commit**

```bash
git add components/SkeletonCard.tsx components/SkeletonProfile.tsx app/directory/DirectoryClient.tsx "app/directory/[id]/page.tsx" app/dashboard/vendor/page.tsx app/dashboard/facility/page.tsx app/dashboard/page.tsx
git commit -m "feat: replace loading text with skeleton loaders across all pages"
```

---

## Task 8: UI Polish — Cards, Filters, Pagination, Colors

**Files:**
- Modify: `components/VendorCard.tsx`
- Modify: `app/directory/DirectoryClient.tsx`
- Modify: `app/onboarding/page.tsx`
- Modify: `app/dashboard/vendor/page.tsx`
- Modify: `app/dashboard/vendor/ProfileForm.tsx`
- Modify: `app/dashboard/facility/page.tsx`

**Step 1: Update VendorCard with hover lift and cream colors**

In `components/VendorCard.tsx`:
- Change card container classes: replace `bg-white border-gray-200` with `bg-white dark:bg-navy-light border-cream-dark`
- Add hover: `hover:-translate-y-1 hover:shadow-md transition-all duration-200`

**Step 2: Update DirectoryClient colors**

In `app/directory/DirectoryClient.tsx`:
- Filter bar: `bg-cream` instead of `bg-white`, `border-cream-dark` instead of `border-gray-200`
- Pagination buttons: `border-cream-dark` base, active page uses `bg-navy text-white`

**Step 3: Update all dashboard/page backgrounds**

Replace `bg-gray-50` with `bg-cream` across:
- `app/onboarding/page.tsx`
- `app/dashboard/vendor/page.tsx`
- `app/dashboard/facility/page.tsx`
- `app/dashboard/page.tsx`

Replace `bg-white` card backgrounds with `bg-white dark:bg-navy-light` and `border-gray-200` with `border-cream-dark`.

Same treatment in `app/dashboard/vendor/ProfileForm.tsx` for the form sections.

**Step 4: Update directory page and profile page backgrounds**

In `app/directory/page.tsx` — `bg-cream` instead of `bg-gray-50`
In `app/directory/[id]/page.tsx` — same treatment

**Step 5: Verify polish**

Run: `npm run dev`
Browse all pages. Expected: consistent cream backgrounds, cards lift on hover, dark mode works on all pages.

**Step 6: Commit**

```bash
git add components/VendorCard.tsx app/directory/DirectoryClient.tsx app/directory/page.tsx "app/directory/[id]/page.tsx" app/onboarding/page.tsx app/dashboard/vendor/page.tsx app/dashboard/vendor/ProfileForm.tsx app/dashboard/facility/page.tsx app/dashboard/page.tsx
git commit -m "feat: UI polish — cream palette, card hover lifts, dark mode support across all pages"
```

---

## Task 9: Mobile Hamburger Nav

**Files:**
- Modify: `components/Navbar.tsx`

**Step 1: Add mobile hamburger menu**

Update `components/Navbar.tsx`:
- Add a `useState` for `mobileOpen`
- Add a hamburger icon button visible only at `md:hidden`
- Desktop nav links wrapped in `hidden md:flex`
- Mobile: a slide-down panel below the header when `mobileOpen` is true, containing all nav links stacked vertically + auth buttons + theme toggle
- Close on link click or outside click

**Step 2: Verify mobile nav**

Resize browser to mobile width.
Expected: Hamburger icon appears, clicking it reveals nav links stacked vertically.

**Step 3: Commit**

```bash
git add components/Navbar.tsx
git commit -m "feat: add responsive hamburger menu for mobile nav"
```

---

## Task 10: Commit auth.config.ts + Push to GitHub

**Step 1: Commit the auth config**

```bash
cd "/Users/blueenvironmental/Documents/ACTIVE WORK/industrial_network_app/enviroconnect"
git add convex/auth.config.ts
git commit -m "feat: add Convex auth config for Clerk JWT integration"
```

**Step 2: Add remote and push**

```bash
git remote add origin https://github.com/paulhpeden2-gitinthecloud/enviroconnect.git
git branch -M main
git push -u origin main
```

**Step 3: Verify push**

Open: https://github.com/paulhpeden2-gitinthecloud/enviroconnect
Expected: All commits visible, code browsable.

---

## Task 11: Final Verification

**Step 1: Run production build**

```bash
npm run build
```

Expected: Build completes with no errors.

**Step 2: Visual check of all pages**

Visit each page and verify in both light and dark mode:
- `/` — landing page with hero image, all sections, scroll animations
- `/directory` — skeleton loaders, cream bg, card hover
- `/about` — all 4 sections, FAQ accordion, contact form
- `/dashboard` — redirect works
- `/sign-in`, `/sign-up` — render correctly

**Step 3: Push final state**

```bash
git push origin main
```
