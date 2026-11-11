import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BookOpen, Boxes, ChevronRight, CircleUserRound, Gauge, Globe2, LogOut, Menu, ReceiptText, Settings2, Shield, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { brandLogo } from "@/assets/weblitex-logo-data";

const nav = [
  { to: "/dashboard" as const, label: "Overview", icon: Gauge },
  { to: "/subdomains" as const, label: "Subdomains", icon: Globe2 },
  { to: "/orders" as const, label: "Orders", icon: ReceiptText },
  { to: "/nameservers" as const, label: "Nameservers", icon: Boxes },
  { to: "/settings" as const, label: "Settings", icon: Settings2 },
];

export function CustomerShell({ title, eyebrow, email, isAdmin, children }: { title: string; eyebrow: string; email?: string | undefined; isAdmin?: boolean | undefined; children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const signOut = async () => { await supabase.auth.signOut(); void navigate({ to: "/" }); };
  const links = <>
    {nav.map(({ to, label, icon: Icon }) => {
      const active = pathname === to || (to === "/subdomains" && pathname.startsWith("/subdomains/"));
      return <Button key={to} asChild variant="ghost" className={`h-11 w-full justify-start gap-3 px-3 text-sm ${active ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
        <Link to={to} onClick={() => setOpen(false)}><Icon className="size-4"/>{label}<ChevronRight className="ml-auto size-3 opacity-40"/></Link>
      </Button>;
    })}
  </>;
  return <main className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl lg:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        <Link to="/dashboard" aria-label="Weblitex Domains dashboard"><img src={brandLogo} alt="Weblitex Domains" className="h-9 w-auto max-w-[150px] object-contain"/></Link>
        <Button size="icon" variant="outline" aria-label="Open menu" onClick={() => setOpen((value) => !value)}>{open ? <X/> : <Menu/>}</Button>
      </div>
      {open && <nav className="space-y-1 border-t border-border p-3">{links}<Button variant="ghost" className="h-11 w-full justify-start gap-3 px-3 text-muted-foreground" onClick={signOut}><LogOut/>Sign out</Button></nav>}
    </header>
    <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen border-r border-border p-5 lg:flex lg:flex-col">
        <Link to="/dashboard" className="border-b border-border pb-6" aria-label="Weblitex Domains dashboard"><img src={brandLogo} alt="Weblitex Domains" className="h-11 w-auto max-w-[190px] object-contain"/></Link>
        <nav className="mt-7 space-y-1">{links}</nav>
        <div className="mt-auto border-t border-border pt-5">
          {isAdmin && <Button asChild variant="ghost" className="mb-1 h-11 w-full justify-start gap-3 px-3"><Link to="/admin"><Shield/>Admin</Link></Button>}
          <Button variant="ghost" className="h-11 w-full justify-start gap-3 px-3 text-muted-foreground" onClick={signOut}><LogOut/>Sign out</Button>
          <div className="mt-4 flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card p-3"><CircleUserRound className="size-8 shrink-0 text-primary"/><div className="min-w-0"><p className="text-xs font-semibold">Account</p><p className="truncate text-[10px] text-muted-foreground">{email}</p></div></div>
        </div>
      </aside>
      <section className="min-w-0 px-4 py-7 sm:px-7 lg:px-10 lg:py-10">
        <div className="mb-8 flex items-start justify-between gap-4 border-b border-border pb-7">
          <div><p className="eyebrow">{eyebrow}</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h1></div>
          <Button asChild variant="outline" size="sm"><Link to="/"> <BookOpen className="size-4"/> <span className="hidden sm:inline">DNS guide</span></Link></Button>
        </div>
        {children}
      </section>
    </div>
  </main>;
}
