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

          {error && <p className="text-sm text-red-500">{error}</p>}

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
