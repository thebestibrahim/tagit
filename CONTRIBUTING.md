# Contributing to Tagit

## Branch strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code. Protected — no direct pushes. |
| `feat/<name>` | New features |
| `fix/<name>` | Bug fixes |
| `chore/<name>` | Deps, config, tooling |

## Workflow

1. Branch off `main`:
   ```bash
   git checkout main && git pull
   git checkout -b feat/your-feature-name
   ```

2. Keep commits focused and use clear messages:
   ```
   Add HMAC verification to scan API
   Fix transfer email missing fallback link
   ```

3. Open a pull request against `main`. Fill in the PR template fully.

4. At least one approval is required before merging. CI (lint, type check, build) must be green.

5. Merge using **Squash and merge** to keep `main` history clean.

## Code standards

- **TypeScript everywhere** — no `any` unless genuinely unavoidable, and comment why.
- **No secrets in code** — use `.env.local` locally, Vercel env vars in production.
- **No `console.log` in production paths** — use structured logging or remove before merge.
- **Tailwind v4** — use utility classes; avoid inline styles.
- Run `npm run lint` and fix all warnings before pushing.

## Environment setup

See [README.md](README.md) for local setup instructions.

## Questions

Reach out to the engineering lead before starting large changes to avoid duplicate work.
