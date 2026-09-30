# Currency Viewer

A simple asset explorer. It loads the 1delta token list and chain metadata from GitHub; the custom JSON URL field can load another list.

## Local development

Use Node.js 22.23.3 (pinned in `.node-version` for Cloudflare Pages builds) and pnpm 10:

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
pnpm dev
```

The production build can be served with `pnpm preview`. The PostCSS import plugin is a direct development dependency because `postcss.config.cjs` loads it during production builds.

## Dependency security

The dependency update moves React Router to 7.18.4, Vite to 6.4.3, PostCSS to 8.5.28, and YAML to 2.9.1. The existing `BrowserRouter` application remains compatible; the refreshed lockfile resolves the reported vulnerable dependency families. Run `pnpm audit` when refreshing dependencies. Asset data and icons are fetched from external providers at runtime, so availability of those services affects the explorer.