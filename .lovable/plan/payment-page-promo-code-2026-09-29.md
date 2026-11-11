# Payment-page promo code

## Build
- Move the promo-code entry from the new-prefix form into each request awaiting payment.
- Add a clear **Apply promo** action beside the Easypaisa payment reference.
- Validate the code securely on the server against expiry and usage limits.
- When valid, consume it once, waive the first-year payment, change the request to manual review, and show the original PKR 300 crossed out with PKR 0.
- Keep invalid-code feedback on the relevant request without submitting it.

## Technical details
- Use one authenticated server action and an atomic database function so concurrent promo submissions cannot exceed usage limits.
- Preserve manual approval: applying a promo submits the request for review but never activates it.
- Add client-side length limits and server-side Zod validation.
- Verify the payment page at desktop and mobile sizes and check the project build status.
