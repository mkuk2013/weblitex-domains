import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_EMAIL = "mkuk2013@gmail.com";
const RESERVED = new Set(["admin", "api", "www"]);
const prefixSchema = z.string().trim().min(1).max(63).regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/);

async function publicClient() {
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']!;
  return createClient<Database>(process.env['SUPABASE_URL']!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
}

async function hashCode(code: string) {
  const bytes = new TextEncoder().encode(code.trim().toUpperCase());
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)))
    .map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const checkPrefix = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ prefix: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const prefix = data.prefix.trim().toLowerCase();
    if (!prefixSchema.safeParse(prefix).success) return { available: false, reason: "Use 1–63 lowercase letters, numbers, or middle hyphens." };
    if (RESERVED.has(prefix)) return { available: false, reason: "This label is reserved." };
    const client = await publicClient();
    const { data: rows, error } = await client.from("domain_requests").select("id").eq("prefix", prefix).neq("status", "rejected").limit(1);
    if (error) throw new Error("Availability could not be checked right now.");
    return rows?.length ? { available: false, reason: "This name already has an active marketplace request." } : { available: true, reason: "No conflicting marketplace request found. Provider availability is checked during review." };
  });

export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = typeof context.claims.email === "string" ? context.claims.email.toLowerCase() : "";
    if (email === ADMIN_EMAIL) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("user_roles").upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });
    }
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    return { isAdmin: Boolean(data) };
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = typeof context.claims.email === "string" ? context.claims.email.toLowerCase() : "";
    if (email === ADMIN_EMAIL) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("user_roles").upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });
    }
    const [{ data: requests, error }, { data: role }] = await Promise.all([
      context.supabase.from("domain_requests").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    ]);
    if (error) throw new Error(error.message);
    return { requests: requests ?? [], isAdmin: Boolean(role), email };
  });

export const createDomainRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ prefix: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const prefix = data.prefix.trim().toLowerCase();
    if (!prefixSchema.safeParse(prefix).success || RESERVED.has(prefix)) throw new Error("Enter a valid, non-reserved prefix.");
    const { data: userData } = await context.supabase.auth.getUser();
    if (!userData.user?.email_confirmed_at) throw new Error("Confirm your email before sending a request.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: conflict } = await supabaseAdmin.from("domain_requests").select("id").eq("prefix", prefix).neq("status", "rejected").maybeSingle();
    if (conflict) throw new Error("This prefix already has an active request.");

    const { error } = await supabaseAdmin.from("domain_requests").insert({
      user_id: context.userId, prefix, price_pkr: 300, promo_applied: false,
      status: "awaiting_payment", payment_status: "pending",
    });
    if (error) throw new Error(error.code === "23505" ? "This prefix was just requested by someone else." : error.message);
    return { ok: true };
  });

export const applyPromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    requestId: z.string().uuid(),
    promoCode: z.string().trim().min(4, "Enter a valid promo code.").max(64),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin.rpc("apply_promo_to_pending_request", {
      _request_id: data.requestId,
      _user_id: context.userId,
      _code_hash: await hashCode(data.promoCode),
    });
    if (error) throw new Error("Promo code could not be applied right now.");
    if (result === "invalid_promo") throw new Error("That promo code is invalid, expired, or fully used.");
    if (result !== "applied") throw new Error("This request can no longer accept a promo code.");
    return { ok: true };
  });

export const submitPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ requestId: z.string().uuid(), reference: z.string().trim().min(4, "Enter the transaction ID.").max(120), receiptPath: z.string().min(1, "Attach the receipt image.").max(300) }).parse(input))
  .handler(async ({ data, context }) => {
    if (!data.receiptPath.startsWith(`${context.userId}/`)) throw new Error("Invalid receipt upload.");
    const { data: row } = await context.supabase.from("domain_requests").select("id,status").eq("id", data.requestId).eq("user_id", context.userId).maybeSingle();
    if (!row || row.status !== "awaiting_payment") throw new Error("This request cannot accept a payment reference.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("domain_requests").update({ payment_reference: data.reference, receipt_path: data.receiptPath, payment_status: "submitted", status: "payment_submitted" }).eq("id", data.requestId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

async function requireAdmin(context: { supabase: any; userId: string; claims: Record<string, unknown> }) {
  const email = typeof context.claims['email'] === "string" ? context.claims['email'].toLowerCase() : "";
  if (email === ADMIN_EMAIL) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });
  }
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("Administrator access required.");
}

export const getAdminRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("domain_requests").select("*").in("status", ["payment_submitted", "review_pending"]).order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return Promise.all((data ?? []).map(async (row) => {
      if (!row.receipt_path) return { ...row, receipt_url: null as string | null };
      const { data: signed } = await supabaseAdmin.storage.from("payment-receipts").createSignedUrl(row.receipt_path, 3600);
      return { ...row, receipt_url: signed?.signedUrl ?? null };
    }));
  });

export const getAdminCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: requests, error } = await supabaseAdmin.from("domain_requests").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    let emails = new Map<string, string>();
    try {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      emails = new Map((usersData?.users ?? []).map((u) => [u.id, u.email ?? ""] as const));
    } catch { /* emails unavailable; requests still shown */ }
    return (requests ?? []).map((row) => ({ ...row, customer_email: emails.get(row.user_id) ?? "unknown" }));
  });

export const getAdminOrderDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ requestId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("domain_requests").select("*").eq("id", data.requestId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Order not found.");
    let customerEmail = "unknown";
    try {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      customerEmail = usersData?.users?.find((u) => u.id === row.user_id)?.email ?? "unknown";
    } catch { /* emails unavailable; order still shown */ }
    let receiptUrl: string | null = null;
    if (row.receipt_path) {
      const { data: signed } = await supabaseAdmin.storage.from("payment-receipts").createSignedUrl(row.receipt_path, 3600);
      receiptUrl = signed?.signedUrl ?? null;
    }
    return { ...row, customer_email: customerEmail, receipt_url: receiptUrl };
  });

export const reviewRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ requestId: z.string().uuid(), decision: z.enum(["approve", "reject"]) }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("domain_requests").select("*").eq("id", data.requestId).maybeSingle();
    if (!row || !["payment_submitted", "review_pending"].includes(row.status)) throw new Error("This request is not ready for review.");
    if (row.payment_status === "submitted" && !row.payment_reference) throw new Error("Verify the Easypaisa proof before approval.");
    const approved = data.decision === "approve";
    const now = new Date();
    const expires = new Date(now); expires.setFullYear(expires.getFullYear() + 1);
    const { error } = await supabaseAdmin.from("domain_requests").update({
      status: approved ? "approved" : "rejected",
      payment_status: approved && row.payment_status === "submitted" ? "verified" : row.payment_status,
      reviewed_at: now.toISOString(), approved_at: approved ? now.toISOString() : null,
      expires_at: approved ? expires.toISOString() : null,
    }).eq("id", data.requestId);
    if (error) throw new Error(error.message);
    if (approved) {
      const { publishRecord, LOVABLE_IP } = await import("./spaceship.server");
      const rec = { host: "@", type: "A" as const, value: LOVABLE_IP, ttl: 3600 };
      try {
        await publishRecord(row.prefix, rec);
        await supabaseAdmin.from("dns_records").insert({ request_id: row.id, user_id: row.user_id, ...rec, priority: null });
      } catch (e) {
        return { ok: true, dnsWarning: (e as Error).message };
      }
    }
    return { ok: true };
  });

export const createPromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ code: z.string().trim().min(4).max(64), usageLimit: z.number().int().min(1).max(100), expiresAt: z.string().optional() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("promo_codes").insert({ code_hash: await hashCode(data.code), usage_limit: data.usageLimit, expires_at: data.expiresAt || null, created_by: context.userId });
    if (error) throw new Error(error.code === "23505" ? "That promo code already exists." : error.message);
    return { ok: true, code: data.code.toUpperCase() };
  });

const dnsTypes = z.enum(["A", "AAAA", "CNAME", "TXT", "MX"]);

async function ownedApprovedRequest(context: { supabase: any; userId: string }, requestId: string) {
  const { data: row } = await context.supabase.from("domain_requests").select("id,prefix,status,expires_at").eq("id", requestId).eq("user_id", context.userId).maybeSingle();
  if (!row || row.status !== "approved") throw new Error("DNS records unlock after your request is approved.");
  if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) throw new Error("This registration has expired.");
  return row;
}

export const getDnsRecords = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ requestId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await ownedApprovedRequest(context, data.requestId);
    const { data: records, error } = await context.supabase.from("dns_records").select("*").eq("request_id", data.requestId).order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return records ?? [];
  });

export const addDnsRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    requestId: z.string().uuid(),
    host: z.string().trim().min(1).max(253).regex(/^(?:@|\*|(?:\*\.)?[a-zA-Z0-9_](?:[a-zA-Z0-9-_.]*[a-zA-Z0-9])?)$/, "Enter @, *, or a valid host name."),
    type: dnsTypes,
    value: z.string().trim().min(1).max(1000),
    ttl: z.number().int().min(60).max(86400).default(3600),
    priority: z.number().int().min(0).max(65535).optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const req = await ownedApprovedRequest(context, data.requestId);
    if (data.type === "MX" && data.priority === undefined) throw new Error("MX records need a priority.");
    if (data.type !== "MX" && data.priority !== undefined) throw new Error("Only MX records use a priority.");
    const { publishRecord } = await import("./spaceship.server");
    await publishRecord(req.prefix, data);
    const { error } = await context.supabase.from("dns_records").insert({
      request_id: data.requestId, user_id: context.userId, host: data.host, type: data.type,
      value: data.value, ttl: data.ttl, priority: data.type === "MX" ? data.priority ?? null : null,
    });
    if (error) throw new Error(error.message.includes("count") ? "This domain already has 50 DNS records." : error.message);
    return { ok: true };
  });

export const deleteDnsRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ recordId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rec } = await context.supabase.from("dns_records").select("*, domain_requests(prefix)").eq("id", data.recordId).eq("user_id", context.userId).maybeSingle();
    if (!rec) throw new Error("Record not found.");
    const { unpublishRecord } = await import("./spaceship.server");
    await unpublishRecord((rec as any).domain_requests.prefix, rec as any);
    const { error } = await context.supabase.from("dns_records").delete().eq("id", data.recordId).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });