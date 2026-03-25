# osta.ee userscript

Userscript for `osta.ee` listing pages:

- Injects a gear/settings button next to product titles.
- Opens a centered modal with a human-readable summary of the listing.
- Provides JSON actions:
  - **Copy as JSON**
  - **Show JSON / Hide JSON**

The modal content is extracted from the page DOM at the moment you click the gear button.

## Install

1. Install a userscript manager (e.g. Tampermonkey / Violentmonkey).
2. Add `osta.ee.user.js` as a new userscript.
3. Ensure it has access to: `https://osta.ee/*` and `https://www.osta.ee/*` (already included in the script metadata).

## Notes

- The extractor skips the script’s own injected `.osta-ee-gear-btn` elements to avoid contaminating data.
- If a field can’t be reliably found on the page, the extractor returns `null` (or `[]` for list fields) rather than guessing.

