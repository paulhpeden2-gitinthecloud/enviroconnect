"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { UserSearch, SelectedUser } from "@/components/shared/UserSearch";

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

  const createConversation = useMutation(api.messaging.mutations.createConversation);

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
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface border border-mist rounded-lg shadow-lg w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-mist">
          <h3
            className="text-lg font-semibold text-text-deep"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            New Message
          </h3>
          <button
            onClick={onClose}
            className="text-slate-custom hover:text-text-deep transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-deep mb-1">
              To
            </label>
            <UserSearch
              selectedUsers={selectedUsers}
              onSelect={(user) => setSelectedUsers((prev) => [...prev, user])}
              onRemove={(id) => setSelectedUsers((prev) => prev.filter((u) => u._id !== id))}
              excludeIds={[userId]}
            />
          </div>

          {selectedUsers.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-text-deep mb-1">
                Group Name (optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Stormwater Project Team"
                className="w-full text-sm border border-mist rounded-md px-3 py-2 bg-surface text-text-deep focus:outline-none focus:border-primary-light focus:ring-2 focus:ring-[#93C5FD]/40"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-deep mb-1">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              rows={3}
              className="w-full text-sm border border-mist rounded-md px-3 py-2 bg-surface text-text-deep focus:outline-none focus:border-primary-light focus:ring-2 focus:ring-[#93C5FD]/40 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-custom hover:text-text-deep transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
