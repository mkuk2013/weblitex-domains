const ZONE = "weblitex.com";
const BASE = `https://spaceship.dev/api/v1/dns/records/${ZONE}`;
export const LOVABLE_IP = "185.158.133.1";

export type DnsInput = { host: string; type: string; value: string; ttl: number; priority?: number | null | undefined };

function headers() {
  const key = process.env["SPACESHIP_API_KEY"];
  const secret = process.env["SPACESHIP_API_SECRET"];
  if (!key || !secret) throw new Error("DNS provider is not connected.");
  return { "X-API-Key": key, "X-API-Secret": secret, "Content-Type": "application/json" };
}

/** Convert a host relative to the user's subdomain into a name relative to weblitex.com */
export function zoneName(prefix: string, host: string) {
  const h = host.trim().toLowerCase().replace(/\.weblitex\.com\.?$/, "");
  if (h === "@" || h === prefix) return prefix;
  if (h.endsWith(`.${prefix}`)) return h;
  return `${h}.${prefix}`;
}

function toItem(prefix: string, r: DnsInput) {
  const base = { type: r.type, name: zoneName(prefix, r.host), ttl: r.ttl };
  switch (r.type) {
    case "A": case "AAAA": return { ...base, address: r.value };
    case "CNAME": return { ...base, cname: r.value };
    case "TXT": return { ...base, value: r.value };
    case "MX": return { ...base, exchange: r.value, preference: r.priority ?? 10 };
    default: throw new Error("Unsupported record type.");
  }
}

async function call(method: "PUT" | "DELETE", body: unknown) {
  const res = await fetch(BASE, { method, headers: headers(), body: JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text();
    console.error("Spaceship DNS error", res.status, text);
    throw new Error(res.status === 401 ? "DNS provider rejected the credentials." : "Could not publish to live DNS. Please try again.");
  }
}

export async function publishRecord(prefix: string, r: DnsInput) {
  await call("PUT", { force: true, items: [toItem(prefix, r)] });
}

export async function unpublishRecord(prefix: string, r: DnsInput) {
  await call("DELETE", [toItem(prefix, r)]);
}
