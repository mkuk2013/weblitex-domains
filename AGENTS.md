<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Architecture Decisions

- Use Lovable Cloud with row-level access policies for all durable marketplace data, because requests and approvals must persist securely.
- Keep public availability checks separate from authenticated customer and administrator mutations, because public pages must remain safe during server rendering.
- Redeem promo codes through one locked database operation, because usage limits and payment waiver must update atomically.
- Use one semantic dark navy, electric-blue, and cyan visual system matching the Weblitex logo across all screens, because the product must remain visually consistent and theme-safe.
- Keep authenticated customer workflows in dedicated portal routes sharing one customer shell, because overview, orders, DNS, nameservers, and settings must remain independently navigable.
