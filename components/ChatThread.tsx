"use client";
import { useEffect, useRef, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { PdfPreviewModal } from "./PdfPreviewModal";

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

  let lastDate = "";

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-1">
      {messages.map((msg, i) => {
        const isMe = msg.senderId === currentUserId;
        const dateStr = formatDateDivider(msg.createdAt);
        const showDate = dateStr !== lastDate;
        lastDate = dateStr;

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
