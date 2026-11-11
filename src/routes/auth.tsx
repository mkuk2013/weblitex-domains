import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Chrome, Loader2, Mail } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/site-header";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { getMyRole } from "@/lib/marketplace.functions";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [
    { title: "Sign in | Weblitex Domains" },
    { name: "description", content: "Sign in or create your Weblitex Domains account." },
    { property: "og:title", content: "Sign in | Weblitex Domains" },
    { property: "og:description", content: "Access your Weblitex Domains requests." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { mode: initialMode } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode ?? "signin");
  const [recovering, setRecovering] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const goHome = async () => {
    try { const { isAdmin } = await getMyRole(); void navigate({ to: isAdmin ? "/admin" : "/dashboard" }); }
    catch { setMessage("You are signed in, but account access could not be verified. Please try again."); }
  };
  useEffect(() => { void supabase.auth.getSession().then(({ data }) => { if (data.session) void goHome(); }); }, [navigate]);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const result = mode === "signup"
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth` } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) return setMessage(result.error.message);
    if (mode === "signup" && !result.data.session) return setMessage("Check your email to confirm your account, then sign in.");
    void goHome();
  }

  async function google() {
    setBusy(true); setMessage("");
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    setBusy(false); if (result.error) setMessage(result.error.message); else if (!result.redirected) void goHome();
  }

  async function requestReset(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (error) return setMessage(error.message);
    setRecoverySent(true);
  }

  return <main className="min-h-screen bg-background text-foreground">
    <SiteHeader />
    <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center px-5 py-10 sm:px-6">
      <div className="glass-panel mx-auto w-full max-w-md p-6 sm:p-10">
        {recovering ? <>
          {recoverySent ? <div className="py-5 text-center">
            <CheckCircle2 className="mx-auto size-12 text-primary" />
            <h1 className="mt-6 text-2xl font-black uppercase tracking-tighter">CHECK_INBOX</h1>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground uppercase">A secure reset link is on its way to your registered terminal.</p>
            <Button variant="outline" className="mt-8 h-12 w-full text-xs uppercase tracking-widest border-primary/30 hover:bg-primary/5" onClick={() => { setRecovering(false); setRecoverySent(false); setMessage(""); }}><ArrowLeft className="mr-2 size-4" />BACK_TO_LOGIN</Button>
          </div> : <>
            <Mail className="size-10 text-primary" />
            <p className="eyebrow mt-6">Protocol: Recovery</p>
            <h1 className="mt-3 text-3xl font-black uppercase tracking-tighter">RESET_PASSWORD</h1>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground uppercase">Enter your account email to receive a secure access token.</p>
            <form className="mt-8 space-y-6" onSubmit={requestReset}>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">EMAIL_ADDRESS</label>
                <Input className="h-12 border-primary/20 bg-primary/5 focus-visible:ring-primary uppercase text-xs" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoFocus />
              </div>
              {message && <p role="alert" className="border border-destructive/50 bg-destructive/10 px-4 py-3 text-[10px] uppercase text-destructive tracking-widest">{message}</p>}
              <Button className="btn-gradient h-12 w-full text-xs" disabled={busy}>{busy && <Loader2 className="mr-2 animate-spin size-4" />}SEND_RESET_LINK</Button>
              <Button type="button" variant="ghost" className="h-12 w-full text-[10px] uppercase tracking-widest hover:text-primary hover:bg-primary/5" onClick={() => { setRecovering(false); setMessage(""); }}><ArrowLeft className="mr-2 size-4" />CANCEL_REQUEST</Button>
            </form>
          </>}
        </> : <>
        <p className="eyebrow">Account access</p>
        <h1 className="mt-3 text-3xl font-bold">{mode === "signin" ? "Welcome back." : "Create your account."}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Confirmation keeps every request tied securely to its owner.</p>
        
        <div className="mt-8 grid grid-cols-2 border border-primary/20 p-1 bg-primary/5">
          {(["signin", "signup"] as const).map((item) => (
            <button 
              key={item} 
              type="button" 
              className={`rounded-lg py-3 text-sm font-semibold transition-all ${mode === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary"}`}
              onClick={() => setMode(item)}
            >
              {item === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <form className="mt-8 space-y-6" onSubmit={submit}>
          <div className="space-y-2">
             <label className="text-sm font-medium">Email</label>
            <Input className="h-12 border-primary/20 bg-primary/5 focus-visible:ring-primary text-xs uppercase" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-end">
               <label className="text-sm font-medium">Password</label>
               {mode === "signin" && <button type="button" className="text-xs text-primary hover:underline" onClick={() => { setRecovering(true); setMessage(""); }}>Forgot password?</button>}
            </div>
            <Input className="h-12 border-primary/20 bg-primary/5 focus-visible:ring-primary text-xs uppercase" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          
          {message && <p className="border border-destructive/50 bg-destructive/10 px-4 py-3 text-[10px] uppercase text-destructive tracking-widest">{message}</p>}
          
          <Button className="btn-gradient h-12 w-full text-xs" disabled={busy}>
            {busy && <Loader2 className="mr-2 animate-spin size-4" />}
             {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="my-8 flex items-center gap-4 text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          OR
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" className="h-12 w-full text-[10px] uppercase tracking-widest border-primary/30 hover:bg-primary/5" onClick={google} disabled={busy}>
          <Chrome className="mr-2 size-4" />
           Continue with Google
        </Button>

        <p className="mt-10 text-center">
          <Link to="/" className="text-[10px] uppercase tracking-widest text-primary hover:underline decoration-primary/30 underline-offset-4">
             ← Back to domain search
          </Link>
        </p>
        </>}
      </div>
    </section>
  </main>;
}
