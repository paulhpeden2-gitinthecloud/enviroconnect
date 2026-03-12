import { mutation } from "../_generated/server";
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

    const allParticipants = args.participantIds.includes(args.createdBy)
      ? args.participantIds
      : [args.createdBy, ...args.participantIds];

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
      return;
    }

    await ctx.db.patch(args.conversationId, {
      participantIds: [...conversation.participantIds, args.userId],
    });
  },
});
