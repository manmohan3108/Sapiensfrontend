# Sapiens UI and UX reference

These are the agreed design guidelines for extending the current Sapiens theme to other pages, one page at a time. They are a flexible reference, not a rigid template. Use judgment to adjust the layout, illustrations, density and interactions to each page's purpose. Prefer a clear, usable result over mechanically following these notes. Explicit user instructions take precedence.

## 1. One consistent theme

Use consistent colours, backgrounds, grid treatment and controls across admin and customer pages. Differences should reflect their tasks and permissions. Reuse shared components and theme tokens where practical; avoid separate palettes drifting apart.

## 2. Dark and light modes

Default to dark mode and remember an explicit user choice in local storage. Dark mode uses deep green surfaces and warm text; light mode uses pale surfaces and dark green text. Check illustrations, grids, borders, icons, inputs, dialogs and interaction states in both modes. Adapt their colours deliberately rather than applying a blanket inversion filter to artwork.

## 3. Colour with purpose

Keep the orange core as the visual identity. Use warm amber for dark-mode primary actions and deep green for light-mode primary actions. Reserve additional colours for meaningful status or feedback. Do not reintroduce the old purple/blue palette during this migration.

Use the established styles as implementation references:

- `src/styles/science-direction.css`: science landing theme.
- `src/styles/auth.css`: login and signup theme.
- `src/styles/home-science.css`: admin and customer identity directories.

Inspect existing tokens and styles before introducing new ones. Keep overrides scoped so they do not accidentally alter unrelated pages.

## 4. Science identity with selective illustrations

Use faint notebook grids and restrained technical details throughout. Mathematical or scientific illustrations may also appear on login, signup, Your Sapiens and other working screens, not only the landing page. Add them where they make the page more distinctive without competing with its content.

Keep illustrations away from text and controls. Use gentle motion where appropriate. Decorative layers must not intercept clicks, interfere with scrolling or reduce readability. Judge each placement visually; do not require decoration on every page.

Possible starting points, to adapt and review per page:

- Login/signup: a small animated scientific figure in the illustration area, keeping the form clear.
- Empty Your Sapiens page: a restrained illustration around the core to make the introduction welcoming.
- Populated Your Sapiens page: small accents near the heading or margins, keeping the directory compact.

These are options for future work, not instructions to add illustrations to every screen automatically. Preserve the established core and illustration assets unless the user requests a change.

## 5. Typography and readability

Use Source Sans 3 for controls, descriptions and data, and Source Serif 4 for selected page headings. Use monospace sparingly for IDs and technical labels. Avoid tiny explanatory text. Maintain clear hierarchy, comfortable line lengths and readable spacing.

## 6. Compact, task-focused layouts

Prefer rows for directories and repeated records. Use cards when grouping information genuinely helps. Avoid large introductions, repeated headings, oversized buttons and unnecessary scrolling. Keep related illustrations and descriptions clearly paired. Preserve useful descriptions rather than shortening them solely to fit a decorative layout.

## 7. Clear, brief wording

Explain what the user can do next. Introduce Sapiens briefly when useful, especially in empty states: a persistent AI individual shaped by experience. Avoid vague slogans, unexplained concepts and claims beyond the product's actual behaviour. Distinguish concepts in development from available functionality when relevant.

## 8. Design every state

Review loading, errors, no items, one item, many items, unmatched searches and actions in progress. Empty states should explain the next step and provide a direct action. An unmatched search is different from an account with no Sapiens. Keep feedback and recovery actions clear.

## 9. Restrained motion

Preserve expressive core animation where it contributes to the experience. Keep working screens calm, text steady and interactions responsive. Respect reduced-motion preferences. Avoid heavy effects and unnecessary animation work outside the visible page area. Do not introduce cursor effects or elaborate motion merely to make a screen feel interactive.

## 10. Accessible interactions

Maintain readable contrast, visible keyboard focus, labelled controls and comfortable touch targets. Information must not depend on colour or hover alone. Check keyboard operation, dialog focus and narrow-screen layouts where relevant.

## 11. Preserve functionality

Styling changes must retain permissions, navigation, validation, search, creation safeguards and existing data behaviour. Keep role-specific tools and actions available to the appropriate users. Do not weaken authentication or change production data to facilitate a visual review.

## 12. Review one page at a time

Check desktop/mobile, both themes and the relevant states. Use the actual page components for visual verification where possible. When a backend is unavailable, use clearly labelled, isolated sample-data previews and distinguish those checks from live integration testing. Remove temporary preview files and mocks after verification unless retaining a preview is requested.

Report what changed, what was tested and any remaining limitations. Keep changes scoped and reversible. Run the build and checks appropriate to the change. Deploy only when requested; local implementation does not imply a production deployment.
