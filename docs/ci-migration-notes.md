CI Migration Notes
- Removed GitHub Actions workflows in `.github/workflows/`.
- GitLab CI is now the source of truth via `.gitlab-ci.yml`.
- Local git configured with `remote.pushDefault=gitlab` so `git push` targets GitLab by default.

2025-09 Tightening
- Lint job now fails the pipeline on ESLint errors (root, web, backend if configured).
- TypeScript checks (tsc) now fail the pipeline on type errors across root/web/backend.
- Web build is required (no allow_failure) when `web/package.json` exists.
