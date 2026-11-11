import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;
  const captured = consumeLastCapturedError() as { message?: string; cause?: { message?: string } } | undefined;
  if (captured?.message === "aborted" || captured?.cause?.message === "aborted") {
    return new Response(null, { status: 499 });
  }

  console.error(captured ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

function isAbort(error: unknown, request: Request): boolean {
  if (request.signal?.aborted) return true;
  let c: unknown = error;
  for (let i = 0; i < 5 && c && typeof c === "object"; i++) {
    const e = c as { name?: string; message?: string; code?: string; cause?: unknown };
    if (e.name === "AbortError" || e.message === "aborted" || e.code === "ECONNRESET") return true;
    c = e.cause;
  }
  return false;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      if (response.status >= 500 && request.signal?.aborted) {
        consumeLastCapturedError();
        return new Response(null, { status: 499 });
      }
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      // Visitor closed/refreshed mid-load; nobody is waiting for this response.
      if (isAbort(error, request)) return new Response(null, { status: 499 });
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
