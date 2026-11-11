# Black-and-lime app redesign

## Goal
Bring the full Weblitex Domains experience in line with the supplied reference screens while preserving the existing domain, payment, promo, receipt, DNS, and admin behavior.

## What will change
- Rework the shared header into a compact black navigation system with the Weblitex mark, lime active states, and mobile-safe controls.
- Apply the reference palette and typography across the homepage, sign-in, password reset, customer dashboard, DNS controls, payment forms, and admin review screens.
- Restyle content into clear outlined panels with restrained rounding, mono labels, lime status chips, and stronger spacing hierarchy.
- Restructure the customer dashboard for easier scanning on phones: overview, new request, request/payment status, receipt upload, promo, and DNS management remain easy to reach.
- Keep `.weblitex.com` as the only suffix in every label and example.

## Validation
- Check public, account, dashboard, DNS/payment, and admin views at desktop and 390px mobile widths.
- Verify no horizontal overflow, clipped labels, overlapping controls, broken interactions, console errors, or build errors.

## Technical details
- Reuse the current React routes, server functions, Lovable Cloud data, and existing button/input components.
- Centralize the black/lime visual language in the existing semantic design tokens; no business logic or database behavior will change.
- Preserve accessibility labels, keyboard behavior, loading states, and receipt image handling.
