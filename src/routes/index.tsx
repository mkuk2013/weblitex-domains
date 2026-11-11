import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowUpRight, BadgeCheck, Check, ChevronDown, Loader2, Network, Search, ServerCog, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { checkPrefix } from "@/lib/marketplace.functions";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Weblitex Domains | A name that actually resolves" },
    { name: "description", content: "Claim your own prefix.weblitex.com subdomain with real DNS records for PKR 300 per year." },
    { property: "og:title", content: "Weblitex Domains | A name that actually resolves" },
    { property: "og:description", content: "Real DNS subdomains on weblitex.com for PKR 300 per year, reviewed by a person." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

const EXAMPLES = ["portfolio", "karachi-bakes", "api-staging", "hamza", "studio-noor"];
const DNS_ROWS = [["A", "@", "203.0.113.24"], ["AAAA", "@", "2001:db8::24"], ["CNAME", "www", "app.yourhost.example"], ["TXT", "@", "v=spf1 include:_spf.mx.example ~all"], ["MX 10", "@", "mx1.mailhost.example"]];
const STEPS = [
  { n: "01", t: "SEARCH", d: "Pick a free name ending in .weblitex.com.", I: Network },
  { n: "02", t: "PAYMENT", d: "Send PKR 300 via Easypaisa to 03122412719 · Khadija.", I: Wallet },
  { n: "03", t: "REVIEW", d: "An administrator confirms the receipt, then approves.", I: BadgeCheck },
  { n: "04", t: "LIVE", d: "Your DNS records publish automatically to live DNS.", I: ServerCog },
];
const FAQ = [
  ["Is this a real domain or a redirect?", "It is a real subdomain with real DNS records — A, AAAA, CNAME, TXT and MX all work."],
  ["How do I pay?", "Send PKR 300 via Easypaisa to 03122412719 (Khadija), then submit the transaction ID and a receipt screenshot from your dashboard."],
  ["Can I use a promo code?", "Yes. A valid promo code waives the payment, but the request is still reviewed by a person."],
  ["When do my DNS records go live?", "Right after approval records publish automatically. Changes can take 10–30 minutes to spread."],
  ["What happens at renewal?", "Nothing is charged automatically. There is no auto-renewal."],
];

function Index() {
  const checker = useServerFn(checkPrefix); const navigate = useNavigate();
  const [prefix, setPrefix] = useState(""); const [checking, setChecking] = useState(false); const [result, setResult] = useState<{ available: boolean; reason: string } | null>(null);
  const [open, setOpen] = useState<number | null>(0);
  async function check(value = prefix) { if (!value) return; setChecking(true); setResult(null); try { setResult(await checker({ data: { prefix: value } })); } catch { setResult({ available: false, reason: "Availability could not be checked right now." }); } finally { setChecking(false); } }
  
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="hidden border-b border-border px-5 py-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase sm:flex sm:justify-between">
        <span>[ REAL_DNS_SUBDOMAINS_V2.0 ]</span>
        <span>[ MANUAL_EASYPAISA_VERIFICATION ]</span>
      </div>
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-border">
        <div className="grid-bg absolute inset-0 opacity-20" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-14 lg:pt-20">
          <div className="grid items-start gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="eyebrow flex items-center gap-2">
                <span className="size-1.5 bg-primary animate-pulse" />
                Registry Status: Active
              </p>
              <h1 className="mt-6 text-5xl font-bold leading-[0.9] tracking-tighter sm:text-8xl uppercase">
                A name that <br/>
                <span className="text-gradient">actually</span><br/>
                resolves.
              </h1>
              <p className="mt-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg font-mono">
                // Search a subdomain, claim it for a year, then run real DNS records managed right from your dashboard.
              </p>
            </div>
            <div className="glass-panel p-6 border-primary/20">
              <p className="eyebrow text-[9px]">SYSTEM_SPECS</p>
              <dl className="mt-6 space-y-4 text-xs font-mono">
                <div className="flex justify-between border-b border-border/50 pb-2"><dt className="text-muted-foreground">PARENT_DOMAIN</dt><dd>weblitex.com</dd></div>
                <div className="flex justify-between border-b border-border/50 pb-2"><dt className="text-muted-foreground">DNS_ENGINE</dt><dd className="text-primary">LIVE</dd></div>
                <div className="flex justify-between border-b border-border/50 pb-2"><dt className="text-muted-foreground">COST_YEARLY</dt><dd>PKR 300.00</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">PAYMENT_GATE</dt><dd className="text-right text-primary">EASYPAISA</dd></div>
              </dl>
            </div>
          </div>

          <div className="glow-wrap relative mt-16">
            <div className="search-glow" aria-hidden="true" />
            <div className="relative flex flex-col gap-2 border border-primary/50 bg-black p-1.5 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2">
                <Search className="size-4 shrink-0 text-primary" />
                <input 
                  aria-label="Domain prefix" 
                  className="min-w-0 flex-1 bg-transparent py-2 font-mono text-lg uppercase outline-none placeholder:text-muted-foreground/30" 
                  placeholder="CHOOSE_PREFIX" 
                  value={prefix} 
                  onChange={(e) => { setPrefix(e.target.value.toLowerCase()); setResult(null); }} 
                  onKeyDown={(e) => { if (e.key === "Enter") void check(); }} 
                />
                <span className="shrink-0 font-mono text-sm text-primary">.weblitex.com</span>
              </div>
              <Button 
                className="btn-gradient h-14 px-8 text-base" 
                onClick={() => void check()} 
                disabled={checking || !prefix}
              >
                {checking ? <Loader2 className="animate-spin" /> : null}
                {checking ? "CHECKING..." : "INITIALIZE"}
              </Button>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 px-1">
            <span className="eyebrow text-[9px]">ACTIVE_NODES:</span>
            {EXAMPLES.map((ex) => (
              <button 
                key={ex} 
                className="border border-border px-3 py-1 font-mono text-[10px] text-muted-foreground transition-all hover:border-primary hover:text-primary hover:bg-primary/5" 
                onClick={() => { setPrefix(ex); void check(ex); }}
              >
                {ex.toUpperCase()}
              </button>
            ))}
          </div>

          {result && (
            <div className={`mt-8 border-l-2 p-6 font-mono ${result.available ? "border-primary bg-primary/5" : "border-destructive bg-destructive/5"}`}>
              <div className="flex items-start gap-4">
                <span className={`mt-1 flex size-5 shrink-0 items-center justify-center ${result.available ? "text-primary" : "text-destructive"}`}>
                  {result.available ? "[+]" : "[x]"}
                </span>
                <div className="min-w-0">
                  <p className="break-all text-xl font-bold">{prefix}.weblitex.com</p>
                  <p className="mt-1 text-xs text-muted-foreground uppercase tracking-widest">{result.reason}</p>
                  {result.available && (
                    <Button 
                      className="btn-gradient mt-6" 
                      onClick={() => void navigate({ to: "/auth", search: { mode: "signup" } })}
                    >
                      CLAIM_DOMAIN <ArrowUpRight className="ml-2 size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-border bg-primary/5">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="eyebrow">Flat Rate pricing</p>
          <h2 className="mt-4 text-4xl font-black uppercase tracking-tighter sm:text-6xl">One price. <br/><span className="text-primary">NO NONSENSE.</span></h2>
          <div className="mt-12 glass-panel p-8 max-w-md border-primary/30">
            <p className="font-mono text-2xl font-bold">.weblitex.com</p>
            <div className="mt-8 flex items-baseline gap-2">
              <span className="text-5xl font-black text-primary">PKR 300</span>
              <span className="font-mono text-sm text-muted-foreground">/ YEAR</span>
            </div>
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-t border-border pt-4">
              [ MANUAL_REVIEW_REQUIRED ] [ NO_AUTO_RENEWAL ]
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-5 py-20 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Infrastructure</p>
            <h2 className="mt-4 text-4xl font-black uppercase tracking-tighter sm:text-6xl">Total <br/><span className="text-primary">DNS CONTROL.</span></h2>
            <p className="mt-8 max-w-md font-mono text-sm leading-relaxed text-muted-foreground">
              // Point it at a VPS, a static host, a website builder or a mail provider. Add records from the dashboard; they publish once your order is approved.
            </p>
          </div>
          <div className="min-w-0 overflow-hidden border border-primary/30 bg-black">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
              <span className="truncate">yourname.weblitex.com</span>
              <span className="text-primary">[ MANAGED ]</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-xs">
                <thead>
                  <tr className="text-left text-[9px] uppercase tracking-widest text-muted-foreground border-b border-border/50">
                    <th className="px-4 py-3 font-bold">TYPE</th>
                    <th className="px-4 py-3 font-bold">NAME</th>
                    <th className="px-4 py-3 font-bold">VALUE</th>
                  </tr>
                </thead>
                <tbody>
                  {DNS_ROWS.map(([t, n, v]) => (
                    <tr key={t} className="border-b border-border/30 hover:bg-primary/5 transition-colors">
                      <td className="px-4 py-4 text-primary font-bold">{t}</td>
                      <td className="px-4 py-4 text-muted-foreground">{n}</td>
                      <td className="whitespace-nowrap px-4 py-4">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-black">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="eyebrow">Operational Flow</p>
          <h2 className="mt-4 text-4xl font-black uppercase tracking-tighter sm:text-6xl text-center lg:text-left">SYSTEM <span className="text-primary">PIPELINE.</span></h2>
          <div className="mt-12 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4 border border-border">
            {STEPS.map(({ n, t, d, I }) => (
              <article key={n} className="bg-black p-8 group hover:bg-primary/5 transition-all">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-primary font-bold">ID_{n}</span>
                  <I className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="mt-10 font-bold tracking-widest font-mono text-primary text-sm underline decoration-primary/30 underline-offset-4">{t}</h3>
                <p className="mt-4 text-xs font-mono leading-relaxed text-muted-foreground uppercase">{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary/5">
        <div className="mx-auto grid max-w-6xl gap-16 px-5 py-20 lg:grid-cols-[1fr_1.5fr]">
          <div>
            <p className="eyebrow">Directives</p>
            <h2 className="mt-4 text-4xl font-black uppercase tracking-tighter sm:text-6xl">COMMON <br/><span className="text-primary">QUERIES.</span></h2>
          </div>
          <div className="space-y-4">
            {FAQ.map(([q, a], i) => (
              <div key={q} className="border border-border bg-black overflow-hidden transition-all hover:border-primary/50">
                <button 
                  className="flex w-full items-center justify-between gap-4 p-5 text-left text-xs font-mono font-bold uppercase tracking-widest text-primary" 
                  onClick={() => setOpen(open === i ? null : i)} 
                  aria-expanded={open === i}
                >
                  {q}
                  <ChevronDown className={`size-4 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
                </button>
                {open === i && (
                  <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-200">
                    <p className="text-xs font-mono leading-relaxed text-muted-foreground uppercase border-t border-border pt-4">
                      {a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-5 pb-20">
          <div className="flex flex-col items-center justify-between gap-10 border border-primary bg-primary p-10 sm:flex-row lg:p-16">
            <h2 className="text-4xl font-black uppercase tracking-tighter sm:text-7xl text-black leading-none">
              SECURE YOUR <br/>SUBDOMAIN.
            </h2>
            <Button className="h-16 px-10 text-lg bg-black text-primary hover:bg-black/90 rounded-none w-full sm:w-auto" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                CONNECT_NOW <ArrowUpRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-10 text-center font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
        [ WEBLITEX_DOMAINS // EST_2026 // ALL_RIGHTS_RESERVED ]
      </footer>
    </main>
  );
}
