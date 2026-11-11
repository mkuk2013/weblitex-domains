# Reference-matched customer dashboard

## Goal
Rebuild the signed-in customer area to follow the supplied screenshots while retaining the current Weblitex blue/cyan logo palette and all existing domain, payment, promo, and DNS functionality.

## What will change
- Add the compact mobile-first customer navigation shown in the references, with clear access to Overview, Subdomains, Orders, Nameservers, Settings, and Sign out.
- Turn the current long dashboard into a scannable overview with summary counts, recent activity, latest orders, and a focused new-subdomain action.
- Give Subdomains and Orders dedicated views instead of stacking every workflow on one page.
- Build a focused subdomain detail screen with status, managed DNS records, custom nameservers, and save controls in the same hierarchy as the reference.
- Add a Settings/Profile view showing account details and password-recovery access without exposing sensitive data.
- Preserve `.weblitex.com` everywhere and keep existing approval, promo, Easypaisa receipt, and DNS behavior intact.

## Technical details
- Use TanStack routes for each customer section and shared customer navigation/layout components.
- Reuse the existing protected server functions and database data; this is a presentation and navigation restructure, not a business-rule change.
- Keep custom nameservers visually available only where current backend support permits; unsupported submission will not be falsely presented as active.
- Apply the existing semantic dark navy, electric-blue, and cyan tokens across all new screens.

## Validation
- Verify every new route on 390px mobile and 1280px desktop.
- Test navigation, empty/loading states, domain request creation, payment/promo controls, DNS record controls, and sign out.
- Confirm no horizontal overflow, overlapping text, broken links, or console/build errors.
