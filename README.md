# osta-ee-tools

Userscript for `osta.ee` listing pages that adds a gear button next to product titles and opens a centered modal with:

- a human-readable summary of the listing;
- structured JSON extracted from the live page DOM;
- quick JSON actions:
  - **Copy as JSON**
  - **Show JSON / Hide JSON**

The extraction runs when you click the gear button, so the output reflects the current visible state of the page.

## Features

- injects a gear/settings button next to listing titles;
- opens a centered modal overlay with extracted listing data;
- shows a readable overview for quick inspection;
- exposes the same data as structured JSON;
- supports copying JSON directly to the clipboard;
- avoids contaminating extracted data with the script’s own injected UI;
- returns `null` or `[]` for fields that cannot be found reliably instead of guessing.

## Supported pages

The script is intended for `osta.ee` listing pages and matches:

- `https://osta.ee/*`
- `https://www.osta.ee/*`
- `https://*.osta.ee/*`

## Installation

1. Install a userscript manager such as:
   - Tampermonkey;
   - Violentmonkey.
2. Create a new userscript.
3. Paste the contents of `osta.ee.user.js`.
4. Save it.
5. Open an `osta.ee` listing page and click the gear button next to the title.

## Extracted data

The script builds a structured schema from the page DOM, including fields such as:

- listing title and ID;
- category path;
- condition, location, quantity;
- current price, buy-now price, bid counts;
- countdown, start time, end time;
- seller details;
- shipping and payment methods;
- description text;
- image URLs;
- engagement counts such as views and watches;
- question counts;
- raw/debug values useful for troubleshooting.

## Notes

- The extractor skips the script’s own injected `.osta-ee-gear-btn` elements.
- Many `osta.ee` pages contain duplicated desktop/mobile sections; the script tries to prefer the canonical visible content and avoid double-counting.
- If a field cannot be found with enough confidence, the script returns `null` or `[]` rather than fabricating a value.
- Values are extracted from the live DOM, not from a static API.

## Known limitations

- `osta.ee` page structure may change at any time, which can break selectors.
- Some page values are dynamic, such as countdowns and view counts, so extracted results may differ after refresh.
- Some listings may have unusual layouts or missing sections, which can lead to partial extraction.
- The script currently focuses on listing pages, not broader marketplace or seller overview pages.

## Development

This project was developed with heavy assistance from Cursor and ChatGPT.

The code is intentionally kept open and permissive so it can be inspected, modified, reused, and extended freely.

## License

Licensed under the MIT License. See [`LICENSE`](./LICENSE).

## Issues

If extraction breaks on a specific listing or page layout, open an issue and include:

- the page URL;
- what field was wrong or missing;
- the JSON output, if possible;
- a short HTML snippet of the relevant section, if available.

That makes selector and parsing bugs much easier to debug.
