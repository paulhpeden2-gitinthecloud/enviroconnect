# In-App Messaging Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a real-time messaging system with dedicated `/messages` page, supporting 1-on-1 and group conversations with PDF attachments and optional RFQ context.

**Architecture:** Two new Convex tables (`conversations`, `messages`) with reactive queries for real-time updates. Split-panel `/messages` page (conversation list + chat thread). New ChatIcon in navbar for unread count. Reuses existing PdfUpload and PdfPreviewModal components.

**Tech Stack:** Convex (backend + real-time), React + Tailwind CSS v4 (frontend), Next.js 14 App Router

**UX Notes:**
- Skeleton screens for loading states (not blank screens)
- Disable send button during async operations (prevent double-send)
- Focus states on all interactive elements (`focus:ring-2 focus:ring-green/30`)
- SVG icons only (Heroicons style), no emoji icons
- `cursor-pointer` on all clickable elements
- Transitions: 150-300ms for micro-interactions
- Mobile: full-screen conversation list → tap to open chat with back button

---

### Task 1: Add conversations and messages tables to schema

**Files:**
- Modify: `convex/schema.ts`

**Step 1: Add both table definitions**

Add these tables to the `defineSchema({...})` call in `convex/schema.ts`, after the `notifications` table (or after `vendorEndorsements` if trust networks was implemented first):

```typescript
conversations: defineTable({
  participantIds: v.array(v.id("users")),
  title: v.optional(v.string()),
  rfqId: v.optional(v.id("rfqs")),
  lastMessageAt: v.number(),
  lastMessagePreview: v.optional(v.string()),
  createdBy: v.id("users"),
  createdAt: v.number(),
})
  .index("by_lastMessageAt", ["lastMessageAt"]),

messages: defineTable({
  conversationId: v.id("conversations"),
  senderId: v.id("users"),
  content: v.string(),
  attachments: v.optional(
    v.array(
      v.object({
        storageId: v.id("_storage"),
        fileName: v.string(),
        fileSize: v.number(),
      })
    )
  ),
  readBy: v.array(v.id("users")),
  createdAt: v.number(),
})
  .index("by_conversationId", ["conversationId"]),
```

**Step 2: Push schema**

Run: `cd /Users/blueenvironmental/Documents/ACTIVE\ WORK/industrial_network_app/enviroconnect && npx convex dev --once`
Expected: Schema pushed, both tables created.

**Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat: add conversations and messages tables to schema"
```

---

### Task 2: Create messaging queries

**Files:**
- Create: `convex/messaging.ts`

**Step 1: Create the queries file**

Create `convex/messaging.ts`:

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all conversations — filter in JS since Convex doesn't support array-contains
    const allConversations = await ctx.db
      .query("conversations")
      .withIndex("by_lastMessageAt")
      .collect();

    const myConversations = allConversations.filter((c) =>
      c.participantIds.includes(args.userId)
    );

    // Sort by most recent first
    myConversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt);

    // Enrich with participant names and unread status
    const enriched = await Promise.all(
      myConversations.map(async (conv) => {
        const participants = await Promise.all(
          conv.participantIds.map(async (id) => {
            const user = await ctx.db.get(id);
            return user
              ? { _id: user._id, name: user.name, company: user.company }
              : null;
          })
        );

        // Check if latest message is unread by this user
        const latestMessages = await ctx.db
          .query("messages")
          .withIndex("by_conversationId", (q) =>
            q.eq("conversationId", conv._id)
          )
          .collect();

        const latestMessage = latestMessages.sort(
          (a, b) => b.createdAt - a.createdAt
        )[0];

        const hasUnread =
          latestMessage &&
          latestMessage.senderId !== args.userId &&
          !latestMessage.readBy.includes(args.userId);

        // Get RFQ title if linked
        let rfqTitle: string | undefined;
        if (conv.rfqId) {
          const rfq = await ctx.db.get(conv.rfqId);
          rfqTitle = rfq?.title;
        }

        return {
          ...conv,
          participants: participants.filter(Boolean),
          hasUnread: !!hasUnread,
          rfqTitle,
        };
      })
    );

    return enriched;
  },
});

export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Validate participant
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !conversation.participantIds.includes(args.userId)) {
      throw new Error("Unauthorized");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    messages.sort((a, b) => a.createdAt - b.createdAt);

    // Enrich with sender names and attachment URLs
    const enriched = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        const attachmentsWithUrls = msg.attachments
          ? await Promise.all(
              msg.attachments.map(async (a) => ({
                ...a,
                url: await ctx.storage.getUrl(a.storageId),
              }))
            )
          : undefined;

        return {
          ...msg,
          senderName: sender?.name ?? "Unknown",
          senderCompany: sender?.company ?? "",
          attachmentsWithUrls,
        };
      })
    );

    return enriched;
  },
});

export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const allConversations = await ctx.db
      .query("conversations")
      .withIndex("by_lastMessageAt")
      .collect();

    const myConversations = allConversations.filter((c) =>
      c.participantIds.includes(args.userId)
    );

    let unreadCount = 0;
    for (const conv of myConversations) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversationId", (q) =>
          q.eq("conversationId", conv._id)
        )
        .collect();

      const latest = messages.sort((a, b) => b.createdAt - a.createdAt)[0];
      if (
        latest &&
        latest.senderId !== args.userId &&
        !latest.readBy.includes(args.userId)
      ) {
        unreadCount++;
      }
    }

    return unreadCount;
  },
});

export const searchUsers = query({
  args: {
    searchQuery: v.string(),
    excludeIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    if (!args.searchQuery.trim()) return [];

    const allUsers = await ctx.db.query("users").collect();
    const term = args.searchQuery.toLowerCase();
    const excludeSet = new Set(args.excludeIds ?? []);

    return allUsers
      .filter(
        (u) =>
          !excludeSet.has(u._id) &&
          (u.name.toLowerCase().includes(term) ||
            u.company.toLowerCase().includes(term))
      )
      .slice(0, 10)
      .map((u) => ({
        _id: u._id,
        name: u.name,
        company: u.company,
        role: u.role,
      }));
  },
});

export const getConversation = query({
  args: { conversationId: v.id("conversations"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !conversation.participantIds.includes(args.userId)) {
      return null;
    }

    const participants = await Promise.all(
      conversation.participantIds.map(async (id) => {
        const user = await ctx.db.get(id);
        return user
          ? { _id: user._id, name: user.name, company: user.company, role: user.role }
          : null;
      })
    );

    let rfqTitle: string | undefined;
    if (conversation.rfqId) {
      const rfq = await ctx.db.get(conversation.rfqId);
      rfqTitle = rfq?.title;
    }

    return {
      ...conversation,
      participants: participants.filter(Boolean),
      rfqTitle,
    };
  },
});
```

**Step 2: Push and regenerate**

Run: `cd /Users/blueenvironmental/Documents/ACTIVE\ WORK/industrial_network_app/enviroconnect && npx convex dev --once`

**Step 3: Commit**

```bash
git add convex/messaging.ts
git commit -m "feat: add messaging queries"
```

---

### Task 3: Create messaging mutations

**Files:**
- Create: `convex/messagingMutations.ts`

**Step 1: Create the mutations file**

Create `convex/messagingMutations.ts`:

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createConversation = mutation({
  args: {
    createdBy: v.id("users"),
    participantIds: v.array(v.id("users")),
    title: v.optional(v.string()),
    rfqId: v.optional(v.id("rfqs")),
    initialMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const creator = await ctx.db.get(args.createdBy);
    if (!creator) throw new Error("User not found");

    // Ensure creator is in participant list
    const allParticipants = args.participantIds.includes(args.createdBy)
      ? args.participantIds
      : [args.createdBy, ...args.participantIds];

    // For 1-on-1 (2 participants, no RFQ), check if conversation already exists
    if (allParticipants.length === 2 && !args.rfqId) {
      const allConversations = await ctx.db
        .query("conversations")
        .collect();

      const existing = allConversations.find(
        (c) =>
          c.participantIds.length === 2 &&
          !c.rfqId &&
          allParticipants.every((id) => c.participantIds.includes(id))
      );

      if (existing) {
        // Send message in existing conversation instead
        const now = Date.now();
        const preview = args.initialMessage.slice(0, 100);

        await ctx.db.insert("messages", {
          conversationId: existing._id,
          senderId: args.createdBy,
          content: args.initialMessage,
          readBy: [args.createdBy],
          createdAt: now,
        });

        await ctx.db.patch(existing._id, {
          lastMessageAt: now,
          lastMessagePreview: preview,
        });

        return existing._id;
      }
    }

    const now = Date.now();
    const preview = args.initialMessage.slice(0, 100);

    const conversationId = await ctx.db.insert("conversations", {
      participantIds: allParticipants,
      title: args.title?.trim() || undefined,
      rfqId: args.rfqId,
      lastMessageAt: now,
      lastMessagePreview: preview,
      createdBy: args.createdBy,
      createdAt: now,
    });

    await ctx.db.insert("messages", {
      conversationId,
      senderId: args.createdBy,
      content: args.initialMessage,
      readBy: [args.createdBy],
      createdAt: now,
    });

    return conversationId;
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    attachments: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          fileName: v.string(),
          fileSize: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !conversation.participantIds.includes(args.senderId)) {
      throw new Error("Unauthorized");
    }

    if (!args.content.trim() && (!args.attachments || args.attachments.length === 0)) {
      throw new Error("Message cannot be empty");
    }

    const now = Date.now();
    const preview = args.content.slice(0, 100) || "(attachment)";

    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      content: args.content,
      attachments: args.attachments,
      readBy: [args.senderId],
      createdAt: now,
    });

    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
      lastMessagePreview: preview,
    });
  },
});

export const markConversationRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !conversation.participantIds.includes(args.userId)) {
      throw new Error("Unauthorized");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    for (const msg of messages) {
      if (!msg.readBy.includes(args.userId)) {
        await ctx.db.patch(msg._id, {
          readBy: [...msg.readBy, args.userId],
        });
      }
    }
  },
});

export const addParticipant = mutation({
  args: {
    conversationId: v.id("conversations"),
    inviterId: v.id("users"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !conversation.participantIds.includes(args.inviterId)) {
      throw new Error("Unauthorized");
    }

    if (conversation.participantIds.includes(args.userId)) {
      return; // Already a participant
    }

    await ctx.db.patch(args.conversationId, {
      participantIds: [...conversation.participantIds, args.userId],
    });
  },
});
```

**Step 2: Push and regenerate**

Run: `cd /Users/blueenvironmental/Documents/ACTIVE\ WORK/industrial_network_app/enviroconnect && npx convex dev --once`

**Step 3: Commit**

```bash
git add convex/messagingMutations.ts
git commit -m "feat: add messaging mutations"
```

---

### Task 4: Create ChatIcon component for navbar

**Files:**
- Create: `components/ChatIcon.tsx`

**Step 1: Create the component**

Create `components/ChatIcon.tsx`:

```tsx
"use client";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function ChatIcon({ userId }: { userId: Id<"users"> }) {
  const unreadCount = useQuery(api.messaging.getUnreadCount, { userId });

  return (
    <Link
      href="/messages"
      className="relative p-2 rounded-lg text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
      aria-label="Messages"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-11.25 5.25v-1.875a3.375 3.375 0 013.375-3.375h9.75a3.375 3.375 0 013.375 3.375v1.875m-18 0A2.625 2.625 0 005.25 21h13.5a2.625 2.625 0 002.625-2.625m-18 0v-7.5A2.625 2.625 0 015.25 6h13.5a2.625 2.625 0 012.625 2.625v7.5"
        />
      </svg>
      {(unreadCount ?? 0) > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
          {unreadCount! > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
```

**Step 2: Commit**

```bash
git add components/ChatIcon.tsx
git commit -m "feat: add ChatIcon component for navbar"
```

---

### Task 5: Add ChatIcon to Navbar

**Files:**
- Modify: `components/Navbar.tsx`

**Step 1: Import ChatIcon**

Add import at top of `components/Navbar.tsx`:
```tsx
import { ChatIcon } from "./ChatIcon";
```

**Step 2: Add ChatIcon next to NotificationBell**

In the desktop auth section where `NotificationBell` is rendered, add `ChatIcon` right after it:

Find this block:
```tsx
{dbUser && (
  <div className="hidden md:block">
    <NotificationBell userId={dbUser._id} />
  </div>
)}
```

Replace with:
```tsx
{dbUser && (
  <div className="hidden md:flex items-center gap-1">
    <NotificationBell userId={dbUser._id} />
    <ChatIcon userId={dbUser._id} />
  </div>
)}
```

**Step 3: Add Messages link to mobile nav**

In the `navLinks` section, add a Messages link (visible to authenticated users). Find where RFQs link is and add after it:

```tsx
{user && (
  <Link href="/messages" onClick={() => setMobileOpen(false)} className="block md:inline text-sm font-medium text-gray-200 hover:text-white py-2 md:py-0 transition-colors">
    Messages
  </Link>
)}
```

Note: Since `user` is from `useUser()`, wrap this link so it only shows for authenticated users.

**Step 4: Commit**

```bash
git add components/Navbar.tsx
git commit -m "feat: add ChatIcon and Messages link to navbar"
```

---

### Task 6: Add /messages route protection

**Files:**
- Modify: `middleware.ts`

**Step 1: Update route matcher**

In `middleware.ts`, find the `createRouteMatcher` call:

```typescript
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);
```

Add `/messages`:

```typescript
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/messages(.*)"]);
```

**Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat: protect /messages route with Clerk auth"
```

---

### Task 7: Create UserSearch component

**Files:**
- Create: `components/UserSearch.tsx`

**Step 1: Create the component**

This is a reusable user search with chip-style selected users. Used by NewMessageModal.

Create `components/UserSearch.tsx`:

```tsx
"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface SelectedUser {
  _id: Id<"users">;
  name: string;
  company: string;
  role: string;
}

interface UserSearchProps {
  selectedUsers: SelectedUser[];
  onSelect: (user: SelectedUser) => void;
  onRemove: (userId: Id<"users">) => void;
  excludeIds?: Id<"users">[];
  placeholder?: string;
}

export function UserSearch({
  selectedUsers,
  onSelect,
  onRemove,
  excludeIds = [],
  placeholder = "Search by name or company...",
}: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const allExcluded = [
    ...excludeIds,
    ...selectedUsers.map((u) => u._id),
  ];

  const results = useQuery(
    api.messaging.searchUsers,
    searchTerm.trim().length >= 2
      ? { searchQuery: searchTerm.trim(), excludeIds: allExcluded }
      : "skip"
  );

  return (
    <div>
      {/* Selected user chips */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedUsers.map((user) => (
            <span
              key={user._id}
              className="inline-flex items-center gap-1 bg-green/10 text-green text-sm px-3 py-1 rounded-full"
            >
              {user.name}
              <button
                type="button"
                onClick={() => onRemove(user._id)}
                className="text-green/60 hover:text-green transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm border border-cream-dark rounded-lg px-3 py-2 bg-white dark:bg-navy dark:border-navy-light dark:text-white focus:outline-none focus:ring-2 focus:ring-green/30"
      />

      {/* Results dropdown */}
      {results && results.length > 0 && (
        <div className="mt-1 border border-cream-dark rounded-lg bg-white dark:bg-navy-light shadow-lg max-h-48 overflow-y-auto">
          {results.map((user) => (
            <button
              key={user._id}
              type="button"
              onClick={() => {
                onSelect(user);
                setSearchTerm("");
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-cream dark:hover:bg-navy transition-colors cursor-pointer flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-full bg-green/10 flex items-center justify-center text-green text-xs font-semibold shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-navy dark:text-white">{user.name}</p>
                <p className="text-xs text-gray-500">
                  {user.company} · {user.role === "vendor" ? "Vendor" : "Facility Manager"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {results && results.length === 0 && searchTerm.trim().length >= 2 && (
        <p className="mt-1 text-xs text-gray-500 px-1">No users found</p>
      )}
    </div>
  );
}

export type { SelectedUser };
```

**Step 2: Commit**

```bash
git add components/UserSearch.tsx
git commit -m "feat: add UserSearch component with chip selection"
```

---

### Task 8: Create NewMessageModal component

**Files:**
- Create: `components/NewMessageModal.tsx`

**Step 1: Create the component**

Create `components/NewMessageModal.tsx`:

```tsx
"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { UserSearch, SelectedUser } from "./UserSearch";

interface NewMessageModalProps {
  userId: Id<"users">;
  onClose: () => void;
  onCreated: (conversationId: Id<"conversations">) => void;
  prefillUser?: SelectedUser;
  prefillRfqId?: Id<"rfqs">;
}

export function NewMessageModal({
  userId,
  onClose,
  onCreated,
  prefillUser,
  prefillRfqId,
}: NewMessageModalProps) {
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>(
    prefillUser ? [prefillUser] : []
  );
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const createConversation = useMutation(api.messagingMutations.createConversation);

  const handleSend = async () => {
    if (selectedUsers.length === 0) {
      setError("Select at least one recipient");
      return;
    }
    if (!message.trim()) {
      setError("Enter a message");
      return;
    }

    setSending(true);
    setError("");
    try {
      const conversationId = await createConversation({
        createdBy: userId,
        participantIds: selectedUsers.map((u) => u._id),
        title: title.trim() || undefined,
        rfqId: prefillRfqId,
        initialMessage: message.trim(),
      });
      onCreated(conversationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create conversation");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-navy-light rounded-xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cream-dark">
          <h3
            className="text-lg font-semibold text-navy dark:text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            New Message
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              To
            </label>
            <UserSearch
              selectedUsers={selectedUsers}
              onSelect={(user) => setSelectedUsers((prev) => [...prev, user])}
              onRemove={(id) => setSelectedUsers((prev) => prev.filter((u) => u._id !== id))}
              excludeIds={[userId]}
            />
          </div>

          {/* Group title (shown when >1 recipient) */}
          {selectedUsers.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Group Name (optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Stormwater Project Team"
                className="w-full text-sm border border-cream-dark rounded-lg px-3 py-2 bg-white dark:bg-navy dark:border-navy-light dark:text-white focus:outline-none focus:ring-2 focus:ring-green/30"
              />
            </div>
          )}

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              rows={3}
              className="w-full text-sm border border-cream-dark rounded-lg px-3 py-2 bg-white dark:bg-navy dark:border-navy-light dark:text-white focus:outline-none focus:ring-2 focus:ring-green/30 resize-none"
            />
          </div>

          {/* Error */}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="px-4 py-2 bg-green text-white text-sm font-medium rounded-lg hover:bg-green-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/NewMessageModal.tsx
git commit -m "feat: add NewMessageModal component"
```

---

### Task 9: Create ConversationList component

**Files:**
- Create: `components/ConversationList.tsx`

**Step 1: Create the component**

Create `components/ConversationList.tsx`:

```tsx
"use client";
import { Id } from "@/convex/_generated/dataModel";

interface ConversationItem {
  _id: Id<"conversations">;
  participantIds: Id<"users">[];
  title?: string;
  lastMessageAt: number;
  lastMessagePreview?: string;
  hasUnread: boolean;
  rfqTitle?: string;
  participants: Array<{
    _id: Id<"users">;
    name: string;
    company: string;
  }>;
}

interface ConversationListProps {
  conversations: ConversationItem[] | undefined;
  activeId: Id<"conversations"> | null;
  currentUserId: Id<"users">;
  onSelect: (id: Id<"conversations">) => void;
  onNewMessage: () => void;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return new Date(timestamp).toLocaleDateString();
}

export function ConversationList({
  conversations,
  activeId,
  currentUserId,
  onSelect,
  onNewMessage,
}: ConversationListProps) {
  const getDisplayName = (conv: ConversationItem) => {
    if (conv.title) return conv.title;
    const others = conv.participants.filter((p) => p._id !== currentUserId);
    if (others.length === 0) return "You";
    if (others.length === 1) return others[0].name;
    return `${others[0].name} +${others.length - 1}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cream-dark">
        <h2
          className="text-lg font-semibold text-navy dark:text-white"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Messages
        </h2>
        <button
          onClick={onNewMessage}
          className="p-2 text-green hover:bg-green/10 rounded-lg transition-colors cursor-pointer"
          aria-label="New message"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations === undefined && (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="w-10 h-10 rounded-full bg-cream-dark dark:bg-navy" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-cream-dark dark:bg-navy rounded w-2/3" />
                  <div className="h-3 bg-cream-dark dark:bg-navy rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {conversations?.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No conversations yet</p>
            <button
              onClick={onNewMessage}
              className="mt-3 text-sm text-green hover:underline font-medium cursor-pointer"
            >
              Start a conversation
            </button>
          </div>
        )}

        {conversations?.map((conv) => (
          <button
            key={conv._id}
            onClick={() => onSelect(conv._id)}
            className={`w-full text-left px-4 py-3 border-b border-cream-dark last:border-0 hover:bg-cream dark:hover:bg-navy transition-colors cursor-pointer flex items-start gap-3 ${
              activeId === conv._id ? "bg-cream dark:bg-navy" : ""
            }`}
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-green/10 flex items-center justify-center text-green text-sm font-semibold shrink-0">
              {getDisplayName(conv).charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm truncate ${conv.hasUnread ? "font-semibold text-navy dark:text-white" : "font-medium text-gray-700 dark:text-gray-300"}`}>
                  {getDisplayName(conv)}
                </p>
                <span className="text-xs text-gray-400 shrink-0">
                  {formatRelativeTime(conv.lastMessageAt)}
                </span>
              </div>

              {conv.lastMessagePreview && (
                <p className={`text-xs truncate mt-0.5 ${conv.hasUnread ? "text-gray-700 dark:text-gray-300" : "text-gray-500 dark:text-gray-400"}`}>
                  {conv.lastMessagePreview}
                </p>
              )}

              {conv.rfqTitle && (
                <span className="inline-block text-xs bg-green/10 text-green px-2 py-0.5 rounded-full mt-1">
                  RFQ: {conv.rfqTitle}
                </span>
              )}
            </div>

            {/* Unread dot */}
            {conv.hasUnread && (
              <div className="w-2.5 h-2.5 rounded-full bg-green shrink-0 mt-1.5" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/ConversationList.tsx
git commit -m "feat: add ConversationList component"
```

---

### Task 10: Create ChatThread component

**Files:**
- Create: `components/ChatThread.tsx`

**Step 1: Create the component**

Create `components/ChatThread.tsx`:

```tsx
"use client";
import { useEffect, useRef } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { PdfPreviewModal } from "./PdfPreviewModal";
import { useState } from "react";

interface Message {
  _id: Id<"messages">;
  senderId: Id<"users">;
  senderName: string;
  senderCompany: string;
  content: string;
  createdAt: number;
  attachmentsWithUrls?: Array<{
    storageId: Id<"_storage">;
    fileName: string;
    fileSize: number;
    url: string | null;
  }>;
}

interface ChatThreadProps {
  messages: Message[] | undefined;
  currentUserId: Id<"users">;
  isGroup: boolean;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateDivider(timestamp: number): string {
  const today = new Date();
  const date = new Date(timestamp);

  if (date.toDateString() === today.toDateString()) return "Today";

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ChatThread({
  messages,
  currentUserId,
  isGroup,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [pdfPreview, setPdfPreview] = useState<{ url: string; name: string } | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  if (messages === undefined) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex gap-3">
            <div className="w-8 h-8 rounded-full bg-cream-dark dark:bg-navy" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-cream-dark dark:bg-navy rounded w-24" />
              <div className="h-4 bg-cream-dark dark:bg-navy rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Group messages by date
  let lastDate = "";

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-1">
      {messages.map((msg, i) => {
        const isMe = msg.senderId === currentUserId;
        const dateStr = formatDateDivider(msg.createdAt);
        const showDate = dateStr !== lastDate;
        lastDate = dateStr;

        // Show sender name if group and different sender from previous
        const prevMsg = i > 0 ? messages[i - 1] : null;
        const showSender =
          isGroup && !isMe && msg.senderId !== prevMsg?.senderId;

        return (
          <div key={msg._id}>
            {showDate && (
              <div className="flex items-center justify-center py-3">
                <span className="text-xs text-gray-400 bg-cream dark:bg-navy px-3 py-1 rounded-full">
                  {dateStr}
                </span>
              </div>
            )}

            <div
              className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}
            >
              <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                {showSender && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 px-3">
                    {msg.senderName}
                  </p>
                )}

                <div
                  className={`rounded-2xl px-4 py-2 ${
                    isMe
                      ? "bg-green text-white rounded-br-md"
                      : "bg-white dark:bg-navy border border-cream-dark dark:border-navy-light text-navy dark:text-white rounded-bl-md"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>

                  {/* Attachments */}
                  {msg.attachmentsWithUrls && msg.attachmentsWithUrls.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.attachmentsWithUrls.map((att, j) => (
                        <button
                          key={j}
                          onClick={() =>
                            att.url && setPdfPreview({ url: att.url, name: att.fileName })
                          }
                          className={`flex items-center gap-2 text-xs px-2 py-1 rounded-lg cursor-pointer transition-colors ${
                            isMe
                              ? "bg-white/20 hover:bg-white/30 text-white"
                              : "bg-cream dark:bg-navy-light hover:bg-cream-dark dark:hover:bg-navy"
                          }`}
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8l-6-6H4zm7 1.5L16.5 9H12a1 1 0 01-1-1V3.5z" />
                          </svg>
                          <span className="truncate max-w-[140px]">{att.fileName}</span>
                          <span className="shrink-0 opacity-70">{formatFileSize(att.fileSize)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <p
                  className={`text-[10px] text-gray-400 mt-0.5 px-2 ${
                    isMe ? "text-right" : "text-left"
                  }`}
                >
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />

      {/* PDF Preview Modal */}
      {pdfPreview && (
        <PdfPreviewModal
          url={pdfPreview.url}
          fileName={pdfPreview.name}
          onClose={() => setPdfPreview(null)}
        />
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/ChatThread.tsx
git commit -m "feat: add ChatThread component"
```

---

### Task 11: Create ChatInput component

**Files:**
- Create: `components/ChatInput.tsx`

**Step 1: Create the component**

Create `components/ChatInput.tsx`:

```tsx
"use client";
import { useState, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PdfUpload, UploadedFile } from "./PdfUpload";

interface ChatInputProps {
  conversationId: Id<"conversations">;
  senderId: Id<"users">;
}

export function ChatInput({ conversationId, senderId }: ChatInputProps) {
  const [content, setContent] = useState("");
  const [showAttach, setShowAttach] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sendMessage = useMutation(api.messagingMutations.sendMessage);
  const generateUploadUrl = useMutation(api.rfqMutations.generateUploadUrl);

  const handleSend = useCallback(async () => {
    if (sending) return;
    if (!content.trim() && files.length === 0) return;

    setSending(true);
    try {
      // Upload attachments first
      let attachments:
        | { storageId: Id<"_storage">; fileName: string; fileSize: number }[]
        | undefined;

      if (files.length > 0) {
        attachments = [];
        for (const uf of files) {
          const uploadUrl = await generateUploadUrl();
          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": uf.file.type },
            body: uf.file,
          });
          if (!result.ok) throw new Error(`Failed to upload ${uf.file.name}`);
          const { storageId } = await result.json();
          attachments.push({
            storageId,
            fileName: uf.file.name,
            fileSize: uf.file.size,
          });
        }
      }

      await sendMessage({
        conversationId,
        senderId,
        content: content.trim(),
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
      });

      setContent("");
      setFiles([]);
      setShowAttach(false);
      textareaRef.current?.focus();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  }, [content, files, sending, conversationId, senderId, sendMessage, generateUploadUrl]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-cream-dark px-4 py-3">
      {/* Attachment area */}
      {showAttach && (
        <div className="mb-3">
          <PdfUpload
            files={files}
            onFilesChange={setFiles}
            maxFiles={3}
          />
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attach button */}
        <button
          type="button"
          onClick={() => setShowAttach(!showAttach)}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            showAttach
              ? "text-green bg-green/10"
              : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-cream dark:hover:bg-navy"
          }`}
          aria-label="Attach file"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
          </svg>
        </button>

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 text-sm border border-cream-dark rounded-xl px-4 py-2.5 bg-white dark:bg-navy dark:border-navy-light dark:text-white focus:outline-none focus:ring-2 focus:ring-green/30 resize-none max-h-32"
          style={{ minHeight: "42px" }}
        />

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || (!content.trim() && files.length === 0)}
          className="p-2.5 bg-green text-white rounded-xl hover:bg-green-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          aria-label="Send message"
        >
          {sending ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          )}
        </button>
      </div>

      <p className="text-[10px] text-gray-400 mt-1 px-2">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/ChatInput.tsx
git commit -m "feat: add ChatInput component with PDF attachments"
```

---

### Task 12: Create MessagesClient page component

**Files:**
- Create: `app/messages/MessagesClient.tsx`

**Step 1: Create the main client component**

This is the split-panel layout. Create `app/messages/MessagesClient.tsx`:

```tsx
"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ConversationList } from "@/components/ConversationList";
import { ChatThread } from "@/components/ChatThread";
import { ChatInput } from "@/components/ChatInput";
import { NewMessageModal } from "@/components/NewMessageModal";

export function MessagesClient() {
  const { user, isLoaded } = useUser();
  const dbUser = useQuery(
    api.users.getUserByClerkId,
    isLoaded && user ? { clerkId: user.id } : "skip"
  );

  const [activeConversationId, setActiveConversationId] =
    useState<Id<"conversations"> | null>(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const conversations = useQuery(
    api.messaging.getConversations,
    dbUser ? { userId: dbUser._id } : "skip"
  );

  const messages = useQuery(
    api.messaging.getMessages,
    activeConversationId && dbUser
      ? { conversationId: activeConversationId, userId: dbUser._id }
      : "skip"
  );

  const activeConversation = useQuery(
    api.messaging.getConversation,
    activeConversationId && dbUser
      ? { conversationId: activeConversationId, userId: dbUser._id }
      : "skip"
  );

  const markRead = useMutation(api.messagingMutations.markConversationRead);

  // Mark conversation as read when opened
  useEffect(() => {
    if (activeConversationId && dbUser) {
      markRead({ conversationId: activeConversationId, userId: dbUser._id });
    }
  }, [activeConversationId, dbUser, markRead]);

  const handleSelectConversation = (id: Id<"conversations">) => {
    setActiveConversationId(id);
    setMobileShowChat(true);
  };

  const handleConversationCreated = (id: Id<"conversations">) => {
    setShowNewMessage(false);
    setActiveConversationId(id);
    setMobileShowChat(true);
  };

  if (!dbUser) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  const getConversationDisplayName = () => {
    if (!activeConversation) return "";
    if (activeConversation.title) return activeConversation.title;
    const others = activeConversation.participants.filter(
      (p) => p._id !== dbUser._id
    );
    return others.map((p) => p.name).join(", ") || "Conversation";
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white dark:bg-navy-light rounded-xl border border-cream-dark overflow-hidden">
      {/* Left panel: Conversation list */}
      <div
        className={`w-full md:w-80 md:border-r border-cream-dark flex-shrink-0 ${
          mobileShowChat ? "hidden md:flex md:flex-col" : "flex flex-col"
        }`}
      >
        <ConversationList
          conversations={conversations}
          activeId={activeConversationId}
          currentUserId={dbUser._id}
          onSelect={handleSelectConversation}
          onNewMessage={() => setShowNewMessage(true)}
        />
      </div>

      {/* Right panel: Chat */}
      <div
        className={`flex-1 flex flex-col ${
          mobileShowChat ? "flex" : "hidden md:flex"
        }`}
      >
        {activeConversationId && activeConversation ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-cream-dark">
              {/* Mobile back button */}
              <button
                onClick={() => setMobileShowChat(false)}
                className="md:hidden p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
                aria-label="Back to conversations"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-navy dark:text-white truncate">
                  {getConversationDisplayName()}
                </h3>
                <p className="text-xs text-gray-500">
                  {activeConversation.participants.length} participant{activeConversation.participants.length !== 1 ? "s" : ""}
                  {activeConversation.rfqTitle && (
                    <> · <a href={`/rfq/${activeConversation.rfqId}`} className="text-green hover:underline">RFQ: {activeConversation.rfqTitle}</a></>
                  )}
                </p>
              </div>
            </div>

            {/* Messages */}
            <ChatThread
              messages={messages}
              currentUserId={dbUser._id}
              isGroup={(activeConversation.participants.length ?? 0) > 2}
            />

            {/* Input */}
            <ChatInput
              conversationId={activeConversationId}
              senderId={dbUser._id}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-11.25 5.25v-1.875a3.375 3.375 0 013.375-3.375h9.75a3.375 3.375 0 013.375 3.375v1.875m-18 0A2.625 2.625 0 005.25 21h13.5a2.625 2.625 0 002.625-2.625m-18 0v-7.5A2.625 2.625 0 015.25 6h13.5a2.625 2.625 0 012.625 2.625v7.5" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select a conversation or start a new one
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New message modal */}
      {showNewMessage && (
        <NewMessageModal
          userId={dbUser._id}
          onClose={() => setShowNewMessage(false)}
          onCreated={handleConversationCreated}
        />
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/messages/MessagesClient.tsx
git commit -m "feat: add MessagesClient with split-panel layout"
```

---

### Task 13: Create /messages page route

**Files:**
- Create: `app/messages/page.tsx`

**Step 1: Create the page**

Create `app/messages/page.tsx`:

```tsx
import { MessagesClient } from "./MessagesClient";

export default function MessagesPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <MessagesClient />
    </main>
  );
}
```

**Step 2: Commit**

```bash
git add app/messages/page.tsx
git commit -m "feat: add /messages page route"
```

---

### Task 14: Add "Message" button to vendor profile page

**Files:**
- Modify: `app/directory/[id]/page.tsx`

**Step 1: Add a Message button near the Endorse button**

In the vendor profile page header area, add a "Message" button that navigates to `/messages` with a query param to pre-fill the recipient.

For now, use a simple link approach — the NewMessageModal can be triggered from the messages page. Add this button in the header area:

```tsx
{dbUser && dbUser._id !== profile?.userId && (
  <Link
    href={`/messages?to=${profile?.userId}`}
    className="inline-flex items-center gap-2 px-4 py-2 border-2 border-navy dark:border-white text-navy dark:text-white text-sm font-medium rounded-lg hover:bg-navy hover:text-white dark:hover:bg-white dark:hover:text-navy transition-all duration-200"
  >
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-11.25 5.25v-1.875a3.375 3.375 0 013.375-3.375h9.75a3.375 3.375 0 013.375 3.375v1.875m-18 0A2.625 2.625 0 005.25 21h13.5a2.625 2.625 0 002.625-2.625m-18 0v-7.5A2.625 2.625 0 015.25 6h13.5a2.625 2.625 0 012.625 2.625v7.5" />
    </svg>
    Message
  </Link>
)}
```

Note: The `?to=` query param support in MessagesClient can be added as a follow-up enhancement — for now the button navigates to the messages page where the user can start a new conversation.

**Step 2: Commit**

```bash
git add app/directory/[id]/page.tsx
git commit -m "feat: add Message button to vendor profile page"
```

---

### Task 15: End-to-end verification

**Step 1: Deploy Convex functions**

Run: `cd /Users/blueenvironmental/Documents/ACTIVE\ WORK/industrial_network_app/enviroconnect && npx convex dev --once`

**Step 2: Start dev server and test**

Run: `npm run dev`

Test flow:
1. Sign in → check navbar shows chat icon (should show 0 unread initially)
2. Navigate to `/messages` → should see empty state "No conversations yet"
3. Click "Start a conversation" → New Message modal opens
4. Search for a user by name → select them → type message → send
5. Conversation appears in list, chat thread shows message
6. Sign in as recipient user → check navbar chat icon shows unread badge (1)
7. Navigate to `/messages` → see conversation with unread dot
8. Click conversation → messages load, unread clears
9. Reply with a message → verify sender sees it in real-time
10. Test PDF attachment: click paperclip → upload PDF → send → recipient can view/download
11. Test group: click "New Message" → add 2+ recipients → set group title → send
12. Navigate to vendor profile → verify "Message" button appears (not on own profile)

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: in-app messaging system complete"
```
