import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { faviconDataUri } from "../assets/weblitex-logo-data";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black font-mono px-5">
      <div className="max-w-md text-center border border-primary/20 bg-primary/5 p-10">
        <h1 className="text-8xl font-black text-primary uppercase tracking-tighter">404</h1>
        <h2 className="mt-4 text-xl font-black text-foreground uppercase tracking-widest">ROUTE_NOT_FOUND</h2>
        <p className="mt-4 text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed">
          The requested terminal address does not exist or has been terminated.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="btn-gradient inline-flex items-center justify-center h-12 px-8 text-xs font-black uppercase tracking-widest"
          >
            RETURN_TO_BASE
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black font-mono px-5">
      <div className="max-w-md text-center border border-destructive/20 bg-destructive/5 p-10">
        <h1 className="text-xl font-black tracking-widest text-destructive uppercase">
          SYSTEM_CRITICAL_ERROR
        </h1>
        <p className="mt-4 text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed">
          An unhandled exception has occurred in the main process.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-gradient inline-flex items-center justify-center h-12 px-8 text-xs font-black uppercase tracking-widest"
          >
            RETRY_SEQUENCE
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center h-12 px-8 text-xs font-black uppercase tracking-widest border border-primary/30 text-primary hover:bg-primary/5"
          >
            ABORT_TO_HOME
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Weblitex Domains" },
      { name: "description", content: "Request a memorable subdomain under weblitex.com." },
      { name: "author", content: "Weblitex" },
      { property: "og:title", content: "Weblitex Domains" },
      { property: "og:description", content: "Your name on the digital street." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: faviconDataUri, type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@500;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
