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
      (p): p is NonNullable<typeof p> => p != null && p._id !== dbUser._id
    );
    return others.map((p) => p.name).join(", ") || "Conversation";
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white dark:bg-navy-light rounded-xl border border-cream-dark overflow-hidden">
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

      <div
        className={`flex-1 flex flex-col ${
          mobileShowChat ? "flex" : "hidden md:flex"
        }`}
      >
        {activeConversationId && activeConversation ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-cream-dark">
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

            <ChatThread
              messages={messages}
              currentUserId={dbUser._id}
              isGroup={(activeConversation.participants.length ?? 0) > 2}
            />

            <ChatInput
              conversationId={activeConversationId}
              senderId={dbUser._id}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select a conversation or start a new one
              </p>
            </div>
          </div>
        )}
      </div>

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
