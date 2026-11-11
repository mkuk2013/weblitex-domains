# Fix DNS status and mobile layout

## Changes
- Make each approved domain’s DNS status reflect its saved records: checking, no records, or configured.
- Keep the separate live-provider warning accurate so saved settings are not confused with public DNS publishing.
- Rework the domain header, status rows, DNS record rows, and form controls to fit narrow mobile screens without clipping.
- Compact the signed-in header on phones while preserving dashboard and admin access.

## Verification
- Test the dashboard at 360px mobile and desktop widths.
- Confirm saved DNS records show “Configured” and all controls remain usable.
- Confirm the app finishes with no build or browser errors.
