import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, KeyRound, Loader2, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Reset Password | Weblitex Domains" },
  ] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [checking, setChecking] = useState(true);
  const [validLink, setValidLink] = useState(false);
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || session) setValidLink(true);
      setChecking(false);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setValidLink(Boolean(data.session));
      setChecking(false);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function updatePassword(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    if (password !== confirmation) return setMessage("ERR: PASSWORDS_DO_NOT_MATCH.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setBusy(false);
      return setMessage(`ERR: ${error.message.toUpperCase()}`);
    }
    await supabase.auth.signOut({ scope: "global" });
    setBusy(false);
    setComplete(true);
  }

  return <main className="min-h-screen bg-black text-foreground font-mono selection:bg-primary selection:text-black">
    <SiteHeader />
    <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center px-5 py-10 sm:px-6">
      <div className="glass-panel mx-auto w-full max-w-md p-6 sm:p-10 border-primary/20">
        {checking ? (
          <div className="flex min-h-52 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : complete ? (
          <div className="py-5 text-center">
            <CheckCircle2 className="mx-auto size-12 text-primary" />
            <h1 className="mt-6 text-2xl font-black uppercase tracking-tighter text-primary">UPDATE_SUCCESS</h1>
            <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground uppercase tracking-widest">Your access credentials have been modified. Re-authentication required.</p>
            <Button className="btn-gradient mt-8 h-12 w-full text-xs" onClick={() => void navigate({ to: "/auth", search: { mode: "signin" } })}>
              INITIALIZE_SIGN_IN
            </Button>
          </div>
        ) : !validLink ? (
          <div className="py-5 text-center">
            <KeyRound className="mx-auto size-12 text-muted-foreground opacity-50" />
            <h1 className="mt-6 text-2xl font-black uppercase tracking-tighter">TOKEN_EXPIRED</h1>
            <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground uppercase tracking-widest">This recovery sequence has terminated. Please request a new token.</p>
            <Button asChild className="btn-gradient mt-8 h-12 w-full text-xs">
              <Link to="/auth">REQUEST_NEW_TOKEN</Link>
            </Button>
          </div>
        ) : (
          <>
            <p className="eyebrow">Node Recovery</p>
            <h1 className="mt-3 text-3xl font-black uppercase tracking-tighter">NEW_CREDENTIALS</h1>
            <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground uppercase tracking-widest">Input unique character sequences to override existing password.</p>
            <form className="mt-8 space-y-6" onSubmit={updatePassword}>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">NEW_PASSWORD</label>
                <Input className="h-12 border-primary/20 bg-primary/5 focus-visible:ring-primary text-xs uppercase" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">CONFIRM_PASSWORD</label>
                <Input className="h-12 border-primary/20 bg-primary/5 focus-visible:ring-primary text-xs uppercase" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
              </div>
              {message && (
                <p role="alert" className="border border-destructive/50 bg-destructive/10 px-4 py-3 text-[10px] uppercase text-destructive tracking-widest">
                  {message}
                </p>
              )}
              <Button className="btn-gradient h-12 w-full text-xs" disabled={busy}>
                {busy && <Loader2 className="mr-2 animate-spin size-4" />}
                OVERRIDE_PASSWORD
              </Button>
            </form>
          </>
        )}
      </div>
    </section>
  </main>;
}
