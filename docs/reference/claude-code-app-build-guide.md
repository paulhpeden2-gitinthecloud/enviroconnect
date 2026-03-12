# Build & Deploy a Web App with Claude Code: Step-by-Step Guide

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | Next.js + React + Tailwind CSS |
| Backend & Database | Convex |
| Authentication | Clerk |
| Payments | Polar |
| Deployment | Vercel |
| AI | Claude API (or other) |

---

## Phase 1: Setup

### 1. Install Claude Code
- Go to `claude.com/product/claude-code`
- Copy the install command and run it in your terminal
- Install the **Claude Code extension** in Cursor (or VS Code)

### 2. Set Up Your IDE
- Install Cursor or VS Code
- Create a new empty project folder for your app
- Open the folder in Cursor
- Open Claude Code via the extension (dotted menu → "Claude Code Open")
- Use **split editor view**: Claude Code on the left, browser preview on the right

### 3. Create External Service Accounts (free tiers)
- **Convex** (`convex.dev`): Create account → Create new project → Name it
- **Clerk** (`clerk.com`): Create account → Create application → Choose auth methods (start with email/password)
- **Polar** (`polar.sh`): Create account → Create organization (use sandbox for testing: `sandbox.polar.sh`)

---

## Phase 2: First Prompt & App Foundation

### 4. Write Your First Prompt
Include these elements in one detailed prompt:

1. **Tech stack** — "Build with Next.js, React, Tailwind, Clerk for auth, Convex for backend/database"
2. **App purpose** — Who it's for, what problem it solves
3. **Architecture** — Pages, navigation structure, key features
4. **User journey** — Signup → onboarding → main app flow
5. **APIs** — Any external APIs you'll use
6. **Design basics** — Font preferences, style direction
7. **Planning file** — "Create a `project-plan.md` file with the full plan broken down step by step"

### 5. Send the Prompt
- Select **Opus 4.6** as the model (`/model` → select Opus)
- Put Claude Code in **Plan mode** (Shift + Tab)
- Paste and send your prompt
- Answer any clarifying questions Claude Code asks
- When the plan looks good, say **"yes and auto accept"**
- Claude Code will build the initial app

---

## Phase 3: Connect Services

### 6. Connect Convex
```bash
# In your project terminal:
cd your-project-folder
npx convex dev
```
- Log in to Convex when prompted
- Select your existing project
- This connects your local code to the Convex dashboard

### 7. Set Up Environment Variables
Create/update `.env.local` in your project root with:
```
NEXT_PUBLIC_CONVEX_URL=<from Convex dashboard>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<from Clerk → API Keys>
CLERK_SECRET_KEY=<from Clerk → API Keys>
CLERK_WEBHOOK_SECRET=<from Clerk webhook setup>
ANTHROPIC_API_KEY=<your key>
# Add any other API keys your app needs
```

### 8. Configure Clerk JWT for Convex
- Clerk dashboard → Configure → JWT Templates
- Click **"New template"** → Select the built-in **"Convex"** template (not a custom one)
- Save the template
- In Convex dashboard → Settings → Environment Variables:
  - Add `CLERK_ISSUER_URL` = your Clerk Frontend API URL

### 9. Run Your App Locally
```bash
# Terminal 1: Start Convex backend
npx convex dev

# Terminal 2: Start Next.js frontend
npm run dev
```
- Open `localhost:3000` in browser (or Cursor's built-in browser)

---

## Phase 4: Test Database & Auth

### 10. Verify the Basics
- **Database**: Check Convex dashboard → Data tab to confirm tables were created
- **Signup**: Create a test account → Verify user appears in Clerk dashboard
- **Data creation**: Create something in the app → Verify it appears in Convex data tables
- **Login/logout**: Sign out and back in to confirm session handling works

### 11. Fix Bugs as They Appear
Use this pattern when reporting bugs to Claude Code:
1. **What happened**: "When I click create app at the end of onboarding..."
2. **Error message**: Paste the exact error from the browser console
3. **File reference**: Include the file name and line number if visible
4. Say: *"Can you investigate and fix this?"*

> **Tip**: Start a new conversation (`/clear`) for each new bug or feature. This saves tokens and gives better results.

---

## Phase 5: Add Payments

### 12. Set Up Polar
- Create a **product** in Polar (e.g., "App Monthly" — recurring, $X/month)
- Create a **checkout link** for that product
- Create a **developer access token** (Settings → bottom of page → New Token → select all scopes)

### 13. Prompt Claude Code for Payments
```
Let's add payments using Polar. Here is the documentation: [paste Polar docs URL]

- Free users can use the app but block [premium feature] unless subscribed
- Use embedded checkout method
- Add upgrade prompt on the gated feature
- Add a banner for non-subscribers
- Check subscription status via Polar webhook
```

### 14. Set Up Webhooks (Local Dev)
Since Polar/Clerk webhooks need a public URL, use a tunneling service:
```bash
npx localtunnel --port 3000
```
- Copy the generated URL
- Use it as the webhook endpoint in both **Polar** and **Clerk** dashboards
- Add the webhook secrets to `.env.local`

### 15. Add Customer Portal
- Prompt Claude Code: *"Add a manage subscription link in the profile menu that opens the Polar customer portal in a new tab"*
- Provide the [Polar customer portal docs URL](https://docs.polar.sh)

---

## Phase 6: Design & Polish

### 16. Improve the UI
- Choose fonts from Google Fonts (e.g., a serif for headings, a sans-serif for body)
- Install the Claude Code frontend design skill:
  ```
  /plugin marketplace add anthropics/claude-code
  ```
- Prompt Claude Code:
  ```
  Use the frontend design skill. Switch fonts to [Font A] for headings 
  and [Font B] for body text. Add soft shadows and subtle hover animations 
  to cards, tabs, and navigation. Don't change colors.
  ```

### 17. Document Your Design System
```
Go through the app and document the entire design system in a 
design-system.json file — components, fonts, typography, colors, 
icons, spacing, shadows, and animations.
```

### 18. Create a CLAUDE.md File
```
/init
```
This generates a `CLAUDE.md` file that gives Claude Code context about your project for every future session.

---

## Phase 7: Build Features

### 19. Feature Prompt Framework
For each new feature, structure your prompt with:

1. **Context**: What you're building and why
2. **Functionality**: List the specific capabilities
3. **User journey** (optional): How a user interacts with it
4. **Technical/design notes** (optional): APIs, styles, constraints

Always start in **Plan mode** (Shift+Tab) for anything beyond small changes.

---

## Phase 8: Security Audit

### 20. Run a Security Review
Prompt Claude Code to audit your app:
```
Do a full security and code audit of this application. Check for:
- Authentication/authorization gaps
- Input validation
- API endpoint security
- Rate limiting
- XSS/SSRF vulnerabilities
- Content security policy

Create the report as security-report.md in a planning folder.
```
Then: *"Fix all critical and high priority issues."*

---

## Phase 9: Version Control

### 21. Set Up GitHub
```bash
# Check if git is initialized (Claude Code often does this automatically)
git status

# If not initialized:
git init

# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push your code
git add -A
git commit -m "initial build with auth, payments, and core features"
git push -u origin head
```

> Push to GitHub after every significant milestone. This is your safety net.

---

## Phase 10: Deploy

### 22. Prepare Production Services

**Convex:**
```bash
npx convex deploy
```
- Note the production deployment URL
- Add environment variables (like `CLERK_ISSUER_URL`) to Convex production → Settings → Environment Variables

**Clerk:**
- Create a **production instance** (clones from development)
- Set up your domain in Clerk → Configure → Domains
- Add DNS records (CNAME) for Clerk to your domain provider
- Create a **production webhook** with your production URL + `/api/webhooks/clerk`
- Subscribe to: `user.created`, `user.updated`, `user.deleted`, `session.created`

**Polar:**
- Create a production account on `polar.sh` (not sandbox)
- Recreate your product, checkout link, and access token
- Create a webhook: `https://yourdomain.com/api/webhooks/polar`

### 23. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) → New Project → Import your GitHub repo
2. Add **all environment variables** (copy from `.env.local`, update values for production):
   - `NEXT_PUBLIC_CONVEX_URL` → production Convex URL
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` → production Clerk key
   - `CLERK_SECRET_KEY` → production Clerk secret
   - `CLERK_WEBHOOK_SECRET` → production webhook secret
   - `CLERK_ISSUER_URL` → your custom Clerk domain
   - `POLAR_ACCESS_TOKEN` → production token
   - `POLAR_WEBHOOK_SECRET` → production webhook secret
   - `POLAR_CHECKOUT_LINK` → production checkout link
   - All API keys
3. Click **Deploy**

### 24. Connect Custom Domain
- In Vercel → Project → Settings → Domains → Add your domain
- Update DNS records as Vercel instructs
- Update **all webhook URLs** in Clerk and Polar to use your final domain (with `www.` if Vercel redirects to it)

### 25. Update Content Security Policy
If Clerk or Polar fail to load on the deployed site, update `next.config.ts` to allow their domains in your CSP headers. Claude Code can help:
```
The Polar checkout / Clerk login is blocked by content security policy 
on the deployed app. Here is the console error: [paste error]. Fix this.
```
Then commit and push to trigger a new Vercel deployment.

---

## Quick Reference: Key Commands

| Action | Command |
|---|---|
| New Claude Code conversation | `/clear` or new chat window |
| Switch to Plan mode | Shift + Tab |
| Select model | `/model` |
| Start Convex backend | `npx convex dev` |
| Start Next.js dev server | `npm run dev` |
| Deploy Convex to production | `npx convex deploy` |
| Commit & push to GitHub | `git add -A && git commit -m "message" && git push` |

## Tips for Success

- **Start with Opus 4.5** for your first prompt and complex features
- **Use Plan mode** before building anything significant
- **Clear conversations** between features to save tokens
- **Push to GitHub frequently** — it's your undo button
- **Create a `CLAUDE.md` file** early so Claude Code always has project context
- **Keep a features list** (e.g., `planning/features.md`) tracking built vs. to-do
- **Test after every major change** — database, auth, and payments especially
- **Use tunneling** (localtunnel or ngrok) for testing webhooks locally
