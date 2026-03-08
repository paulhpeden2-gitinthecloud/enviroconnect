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
