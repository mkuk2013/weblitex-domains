# Weblitex Domains — Admin orders fix (2026-11-11)

## Masla kya tha
/admin page par "All orders and customers" wali list mein orders nazar aate thay
lekin khulte nahi thay — row par koi link/button/detail nahi thi. Admin order
khol kar receipt aur payment verify nahi kar sakta tha, na approve/reject.

## Fix — 2 files badli hain
1. `src/routes/_authenticated/admin.tsx`
   - Har order row clickable + "View" button (All orders list aur review queue dono mein).
   - Click karne par order detail Dialog khulta hai: subdomain, customer email,
     status, payment status, price, Transaction ID, receipt image (Easypaisa proof),
     requested/reviewed/expires dates.
   - Detail mein Approve / Reject buttons (existing reviewRequest se).
   - Jo order abhi "awaiting_payment" hai (payment submit nahi hui), us par
     saaf note dikhta hai ke approve us waqt hoga jab customer payment bhej de.
2. `src/lib/marketplace.functions.ts`
   - Naya admin-only server function `getAdminOrderDetail` — ek order ki poori
     detail + signed receipt URL deta hai (requireAdmin check ke saath).

Kuch aur nahi badla: login routing, admin email (mkuk2013@gmail.com),
aur baaki pages waisay ke waisay hain.

## Verify kiya gaya
- `bun install` + `tsc --noEmit`: 0 errors
- `bun run build`: kamyab (admin chunk mein "Order detail" / "View order" maujood)

## Lovable par upload kaisay karein (2 rastay)
A. Lovable credits add karein (lovable.dev/settings/billing), phir Muse ko
   batayen — woh fix Lovable ko bhej dega.
B. Baghair credits: Lovable editor mein GitHub -> Connect to GitHub ->
   Create Repository dabayen. Repo ban jaye to naam bata dein — Muse fixed
   code us repo ki main branch par push kar dega aur Lovable khud pull kar
   lega (two-way sync), phir site auto-update ho jayegi.

Note: `.env` is zip mein nahi hai — `.env.example` mein key ke naam hain,
values Lovable se copy karein. `node_modules` aur `.output` bhi nahi hain
(`bun install` se wapas ban jate hain).

## Mutabadil (sirf 1 file paste karni ho)
`patch-admin-orders/` folder mein aik tayyar admin.tsx hai jo row ko wahin
expand kar deta hai (Dialog ki bajaye inline detail) — sirf woh 1 file
Lovable editor mein paste karni hoti hai, server function ki zaroorat nahi.
Farq: us mein receipt image sirf un orders ki dikhti hai jo review queue
mein bhi hon; upar wali asal fix mein receipt har order ki khulti hai
(getAdminOrderDetail ki wajah se). Dono mein se aik lagayen, dono nahi.
