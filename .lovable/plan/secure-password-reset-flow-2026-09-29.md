# Secure password reset flow

## User experience
- Add a **Forgot password?** action below the sign-in password field.
- Show a focused email form that sends a secure, time-limited reset link and a neutral success message that does not reveal whether an account exists.
- Add a public reset page opened by the email link, with new-password and confirm-password fields, validation, clear expired-link guidance, and a return-to-sign-in action.
- After a successful reset, sign the user out of recovery mode and return them to sign in with the new password.

## Technical details
- Ensure email/password authentication remains enabled with leaked-password protection.
- Use the managed authentication reset APIs; no passwords or reset tokens will be stored in app tables.
- Set the reset email redirect to the same-site `/reset-password` page.
- Keep both pages aligned with the existing Weblitex dark glass design and add unique page metadata.
- Verify request, invalid-link, password-mismatch, successful-reset, desktop, and mobile states without exposing test credentials.
