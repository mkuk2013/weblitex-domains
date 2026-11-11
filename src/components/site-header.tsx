import { Link } from "@tanstack/react-router";
import { Home, LayoutDashboard, LogIn, Shield, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import brandLogo from "@/assets/weblitex-domains-logo-transparent.png";

export function SiteHeader({ account = false, admin = false }: { account?: boolean; admin?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto grid min-h-20 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center" aria-label="Weblitex Domains home">
          <img src={brandLogo} alt="Weblitex Domains" className="h-9 w-auto max-w-[150px] object-contain sm:h-11 sm:max-w-[190px]" />
        </Link>
        <nav className="flex shrink-0 items-center gap-1.5">
          {account && <Button asChild variant="ghost" size="icon"><Link to="/" aria-label="Home"><Home /></Link></Button>}
          {admin && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin" aria-label="Admin">
                <Shield className="size-4 sm:hidden"/>
                <span className="hidden sm:inline">Admin</span>
              </Link>
            </Button>
          )}
          <Button asChild variant={account ? "secondary" : "outline"} size={account ? "icon" : "sm"}>
            <Link to={account ? "/dashboard" : "/auth"} aria-label={account ? "Dashboard" : "Sign in"}>
              {account ? <LayoutDashboard className="size-4"/> : <LogIn className="size-4 sm:hidden"/>}
              <span className={account ? "sr-only" : "hidden sm:inline"}>{account ? "Dashboard" : "Sign in"}</span>
            </Link>
          </Button>
          {!account && (
            <Button asChild className="btn-gradient h-9 px-4" size="sm">
              <Link to="/auth" search={{ mode: "signup" }} aria-label="Create account">
                <UserPlus className="size-4 sm:hidden"/>
                <span className="hidden sm:inline">Create account</span>
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
