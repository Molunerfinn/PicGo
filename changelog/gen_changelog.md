# gen_changelog.md

This guide describes how to generate a consolidated changelog for any PicGo release series (e.g., 2.4.0, 2.5.0) from the GitHub release notes of its betas and finals.

## Source of truth
- Use GitHub release pages only (e.g., `https://github.com/Molunerfinn/PicGo/releases/tag/vX.Y.Z-beta.N` and `vX.Y.Z` if present). You can fetch these via MCP GitHub APIs (e.g., `get_release_by_tag`, `list_releases`) instead of manual browsing.
- Do **not** use `CHANGELOG.md` in the repo.
- Preserve all text and images exactly as written in the releases.

## Structure
- Target file: `changelog/X.Y.Z.md` (replace with the series version).
- Three top-level sections: `## Features`, `## Bug Fixes`, `## Other`.
- Do **not** nest content under individual beta version headers; merge all items into these sections.
- Keep items in chronological order (early → late) within each section, mirroring the beta sequence.
- Keep inline issue references, thanks, and notes as-is.
- Remove download-link sections entirely.
- After the English sections, insert a line with `----------`, then add a full Chinese translation with the same structure/content (including images).

## Formatting rules
- Markdown, plain ASCII.
- Bullet lists only; no numbered lists required.
- Indent images under their bullet with two spaces to keep association clear.
- Keep inline HTML image tags from the releases (e.g., `<img width="...">`) untouched.
- Keep line breaks and multi-line notes intact.
- Do not reword or summarize; copy content verbatim except for removing beta headers and download sections.
- Chinese translation must mirror the English bullets in order and content (keep images alongside the translated bullets).

## Regeneration steps
1) Collect all release bodies for the target series (e.g., `vX.Y.Z-beta.0…N` and, if present, `vX.Y.Z`) from GitHub releases.
2) For each release, copy bullets and images into the appropriate section:
   - Features ↔ “Feature(s)” or “Features” blocks.
   - Bug Fixes ↔ “Bug Fixes” blocks.
   - Other ↔ “Other”, “Notice”, or misc notes that are not features/bugs.
3) Omit “国内可下载链接” (or any download links) entirely.
4) Drop beta subheadings; keep only section-level bullets in chronological order.
5) Ensure images remain adjacent to their bullets with indentation.
6) After the English sections are complete, insert `----------` on its own line.
7) Append the Chinese translation, preserving bullet order and images, under `## Features`, `## Bug Fixes`, `## Other` again (same section titles, just Chinese content; no “(Chinese)” suffix).
8) Save the result to `changelog/X.Y.Z.md`.

## Quick checklist
- [ ] All features present with images kept.
- [ ] All bug fixes present.
- [ ] All “Other” notes present.
- [ ] No beta headers.
- [ ] No download links.
- [ ] Chronological ordering preserved.
- [ ] Chinese translation present with matching bullets/images after `----------`.
