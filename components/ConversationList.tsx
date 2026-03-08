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

            {conv.hasUnread && (
              <div className="w-2.5 h-2.5 rounded-full bg-green shrink-0 mt-1.5" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
