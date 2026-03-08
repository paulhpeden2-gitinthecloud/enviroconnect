import { query } from "./_generated/server";
import { v } from "convex/values";

export const getConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const allConversations = await ctx.db
      .query("conversations")
      .withIndex("by_lastMessageAt")
      .collect();

    const myConversations = allConversations.filter((c) =>
      c.participantIds.includes(args.userId)
    );

    myConversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt);

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
