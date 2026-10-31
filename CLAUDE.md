@AGENTS.md

## Never publish drafts

This repo is public. Draft articles never go into a commit, a push or a PR.

- A draft lives in `content/drafts/`; its images in `public/drafts/`; its figure components in `components/drafts/`. All three are gitignored. Publishing is moving the files out into `content/articles/`, `public/…` and `components/articles/`.
- The build refuses a `draft:` line in frontmatter, so nothing gets drafted in `content/articles/` out of habit.
- Before committing, stage by explicit path, never `git add -A` over `content/`, and check nothing staged belongs to an unpublished article. If unsure, leave it uncommitted and ask.
