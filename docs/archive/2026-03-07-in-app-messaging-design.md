# In-App Messaging — Design Document

## Overview

Free-form direct messaging between any users on the platform, with optional RFQ context. Supports 1-on-1 and group conversations. Real-time via Convex reactive queries.

## Core Concepts

- **Anyone can message anyone** — vendors, facility managers, mixed
- **1-on-1 AND group conversations** — any conversation can become a group by inviting more people
- **Optional RFQ link** — attach an RFQ for context (e.g., "Let's discuss your proposal for RFQ #123")
- **Optional group title** — for naming group conversations
- **PDF attachments** — reuses existing PdfUpload component and file storage pattern
- **Real-time** — Convex reactive queries handle live updates automatically

## Data Model

### New Table: `conversations`

```
conversations:
  participantIds: Id<"users">[]    — all members of the conversation
  title: optional string            — optional group name
  rfqId: optional Id<"rfqs">        — optional linked RFQ
  lastMessageAt: number             — timestamp of most recent message (for sorting)
  lastMessagePreview: optional string — first 100 chars of last message (for list view)
  createdBy: Id<"users">            — who started the conversation
  createdAt: number

Indexes:
  by_participantIds: [participantIds]  — not usable for array contains, but needed for Convex
  by_lastMessageAt: [lastMessageAt]    — sorting conversations by recency
```

Note: Convex doesn't support array-contains queries. To find conversations for a user, we'll query all conversations and filter by `participantIds.includes(userId)`. For scale, we could add a separate `conversationMembers` junction table later, but for MVP the user base is small enough that filtering works fine.

### New Table: `messages`

```
messages:
  conversationId: Id<"conversations">
  senderId: Id<"users">
  content: string                    — message text
  attachments: optional Array<{
    storageId: Id<"_storage">,
    fileName: string,
    fileSize: number
  }>
  readBy: Id<"users">[]             — users who have read this message
  createdAt: number

Indexes:
  by_conversationId: [conversationId]
```

### Unread Count Strategy

Rather than a separate `unreadCounts` table, we compute unread count by:
1. For each conversation the user is in, find the latest message
2. Check if `readBy` includes the user
3. Count conversations with unread messages

This is simple and correct. If performance becomes an issue at scale, we can add a materialized count later.

## Convex Functions

### Queries (`convex/messaging.ts`)

1. **`getConversations`** — List all conversations for a user, sorted by most recent
   - Args: `{ userId: Id<"users"> }`
   - Returns: conversations with participant names, last message preview, unread indicator
   - Logic: Query all conversations, filter by `participantIds.includes(userId)`, sort by `lastMessageAt` desc
   - Join participant names from `users` table

2. **`getMessages`** — Get messages for a conversation (paginated)
   - Args: `{ conversationId: Id<"conversations">, limit?: number }`
   - Returns: messages with sender name, resolved attachment URLs
   - Validates: caller is a participant

3. **`getUnreadCount`** — Total unread conversations for navbar badge
   - Args: `{ userId: Id<"users"> }`
   - Returns: number of conversations with unread messages

4. **`searchUsers`** — Search users by name/company for "New Message" flow
   - Args: `{ query: string, excludeIds?: Id<"users">[] }`
   - Returns: matching users (name, company, role)

### Mutations (`convex/messagingMutations.ts`)

1. **`createConversation`** — Start a new conversation
   - Args: `{ createdBy: Id<"users">, participantIds: Id<"users">[], title?: string, rfqId?: Id<"rfqs">, initialMessage: string }`
   - Logic: Check if 1-on-1 conversation already exists between these two users → reuse it. Otherwise create new.
   - Creates conversation + first message in one transaction

2. **`sendMessage`** — Send a message in an existing conversation
   - Args: `{ conversationId: Id<"conversations">, senderId: Id<"users">, content: string, attachments?: Array<{...}> }`
   - Validates: sender is a participant
   - Updates `lastMessageAt` and `lastMessagePreview` on conversation

3. **`markConversationRead`** — Mark all messages in a conversation as read by user
   - Args: `{ conversationId: Id<"conversations">, userId: Id<"users"> }`
   - Logic: Find all messages where `readBy` doesn't include `userId`, patch each

4. **`addParticipant`** — Invite someone to a conversation
   - Args: `{ conversationId: Id<"conversations">, inviterId: Id<"users">, userId: Id<"users"> }`
   - Validates: inviter is a participant
   - Adds userId to `participantIds` array

## UI Design

### `/messages` Page — Split Panel Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Navbar                                                        │
├──────────────┬───────────────────────────────────────────────┤
│              │                                               │
│ Conversations│  Conversation Header                          │
│              │  ─────────────────────────────────────────── │
│ [🔍 Search ] │                                               │
│ [+ New Msg ] │  John: Hey, about that stormwater project...  │
│              │                                               │
│ ┌──────────┐ │  You: Sure, I can send the report.            │
│ │ Acme Env │ │                                               │
│ │ "Sounds  │ │  John: Great, please do.                      │
│ │ good..." │ │                                               │
│ │ 2m ago   │ │  ─────────────────────────────────────────── │
│ └──────────┘ │  [Type a message...        ] [📎] [Send]      │
│              │                                               │
│ ┌──────────┐ │                                               │
│ │ XYZ Svc  │ │                                               │
│ │ "Let me  │ │                                               │
│ │ check"   │ │                                               │
│ │ 1h ago   │ │                                               │
│ └──────────┘ │                                               │
│              │                                               │
├──────────────┴───────────────────────────────────────────────┤
│ Footer                                                        │
└──────────────────────────────────────────────────────────────┘
```

**Desktop:** Side-by-side panels (left: 320px conversation list, right: flex-1 chat)
**Mobile:** Conversation list is full-width. Tapping a conversation opens chat full-screen with a back button.

### Conversation List (Left Panel)

Each conversation row shows:
- Participant avatar(s) — first letter circle(s)
- Group title (if set) or participant names
- Last message preview (truncated to ~60 chars)
- Timestamp (relative: "2m ago", "1h ago", "Yesterday")
- Unread dot indicator (green dot if unread)
- RFQ badge if linked to an RFQ

### Active Chat (Right Panel)

**Header:**
- Participant names (or group title)
- RFQ link badge (if attached) — clickable, goes to RFQ detail
- "Add People" button (opens user search dropdown)
- Participant count for groups

**Message Thread:**
- Messages grouped by sender, newest at bottom
- Each message: sender name (if group), content, timestamp
- PDF attachments shown as file chips (reuse styling from RFQ proposals)
- Click PDF → PdfPreviewModal (reuse existing component)
- Auto-scroll to bottom on new messages

**Input Area:**
- Text input (multi-line, grows with content, max ~4 lines)
- PDF attach button (opens PdfUpload, max 3 files per message)
- Send button (or Enter to send, Shift+Enter for newline)

### New Message Flow

1. Click "+ New Message" in conversation list
2. Modal or inline UI with:
   - User search field (search by name or company)
   - Selected recipients shown as chips
   - Optional: "Link to RFQ" dropdown
   - Optional: "Group Title" input (appears when >1 recipient)
   - Message text field
   - Send button
3. Creates conversation + sends first message

### "Message" Button Integration

Add a "Message" button on:
- **Vendor profile page** — next to Endorse button
- **RFQ detail page** — next to vendor's proposal (for FM to message vendor)

These buttons navigate to `/messages` and auto-create/open a conversation with that user.

## Navbar Chat Icon

### Location
Next to the existing NotificationBell, add a chat bubble icon with unread count badge.

### Behavior
- Shows unread conversation count (not unread message count)
- Click → navigates to `/messages` (not a dropdown — messages need the full page)
- Badge styling matches NotificationBell: red circle with white number, "9+" overflow

### Component: `ChatIcon`
```
┌──────────────────────────────────────────────┐
│ ... [🔔 3] [💬 2] [Dashboard] [Sign Out]     │
└──────────────────────────────────────────────┘
```

## Auth & Access

- Must be signed in to access `/messages`
- Add `/messages` to middleware route protection (same as `/dashboard`)
- Any authenticated user can message any other user
- Can only see conversations you're a participant in

## Files to Create/Modify

### Create:
- `convex/messaging.ts` — queries
- `convex/messagingMutations.ts` — mutations
- `app/messages/page.tsx` — messages page (server component wrapper)
- `app/messages/MessagesClient.tsx` — main client component with split panel
- `components/ChatIcon.tsx` — navbar chat icon with unread badge
- `components/ConversationList.tsx` — left panel conversation list
- `components/ChatThread.tsx` — right panel message thread
- `components/ChatInput.tsx` — message input with PDF attach
- `components/NewMessageModal.tsx` — new message creation flow
- `components/UserSearch.tsx` — reusable user search with chips

### Modify:
- `convex/schema.ts` — add `conversations` and `messages` tables
- `components/Navbar.tsx` — add ChatIcon next to NotificationBell
- `middleware.ts` — add `/messages` to protected routes
- `app/directory/[id]/page.tsx` — add "Message" button
