import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { Webhook } from "svix";

const http = httpRouter();

http.route({
  path: "/api/webhooks/clerk",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret)
      return new Response("Webhook secret not configured", { status: 500 });

    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature)
      return new Response("Missing svix headers", { status: 400 });

    const payload = await request.text();
    const wh = new Webhook(webhookSecret);

    let evt: { type: string; data: Record<string, unknown> };
    try {
      evt = wh.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as typeof evt;
    } catch {
      return new Response("Invalid webhook signature", { status: 400 });
    }

    const { type, data } = evt;

    if (type === "user.updated") {
      const emailArr = data.email_addresses as
        | Array<{ email_address: string }>
        | undefined;
      const email = emailArr?.[0]?.email_address;
      const name =
        `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || undefined;
      if (email || name) {
        await ctx.runMutation(api.users.updateUser, {
          clerkId: data.id as string,
          email,
          name,
        });
      }
    }

    return new Response(null, { status: 200 });
  }),
});

export default http;
