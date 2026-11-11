# Weblitex Domains — Admin "View order" patch (no Lovable AI credits needed)

Date prepared: 2026-11-11 (Asia/Karachi)
File to replace: `src/routes/_authenticated/admin.tsx`
New file: `admin.tsx` in this folder (full replacement — only 3 changes vs original)

## What this fixes
On `/admin`, the **"All orders and customers"** list showed each order as one line with no way to open it.
Now every order row has a **"View order"** button that expands the full detail:
customer email, user ID, status, payment status, price, promo applied,
Transaction ID, receipt path, created / updated / reviewed / approved / expiry dates, order ID.
- If the order is in payment review (`payment_submitted` or `review_pending`), **Approve / Reject** buttons appear in the detail — same `reviewRequest` call as the review queue above it.
- If the order is not in payment review, a note explains why Approve/Reject is unavailable (the backend `reviewRequest` only accepts those two statuses — showing the buttons for other statuses would just error).
- The Easypaisa receipt image is shown when the order is also in the review queue (that is the only place a signed receipt URL is fetched). Otherwise the receipt path text is shown.

Nothing else changes: promo codes, review queue, refresh, and error handling are byte-identical to the original except the 3 edits below.

## The 3 edits (for surgical paste in Lovable editor, if you prefer)
1. Import line — add `ChevronDown, ChevronUp` to the lucide-react import.
2. After the promo state line, add: `const [openOrderId, setOpenOrderId] = useState<string | null>(null);`
3. Replace the whole `customers.map((row) => (...))` block with the new expandable version (see `admin.tsx`).

## How to apply without AI credits
Option A (full file): In Lovable editor, open `src/routes/_authenticated/admin.tsx`, select all, paste the contents of `admin.tsx` from this folder, save/publish.
Option B (surgical): Make the 3 edits above by hand in the editor.

## Verification done here
- Read the delivered zip code (`weblitex-domains-code/`) and confirmed data shape in `src/lib/marketplace.functions.ts` (`getAdminCustomers` returns all `domain_requests` rows + `customer_email`; `reviewRequest` guards on `payment_submitted` / `review_pending`) and `src/integrations/supabase/types.ts` (row fields used all exist).
- TypeScript parse check (tsc 5.6, skipLibCheck): patched file produces only the same 9 × TS2307 "cannot find module" errors as the original (project deps not installed in this copy) — **zero syntax errors**, identical error profile.
- Not done: full project build / live deploy test — needs Lovable publish (or `bun install && bun run build` in the full project) and a phone check on /admin, same as the logout-fix verdicts.

Rollback: the original file is in the delivered `weblitex-domains-code.zip` (or `src/routes/_authenticated/admin.tsx` in the untouched code copy).
