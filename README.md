# dsh-bilingual-ui

Rewrites third-party plugins' English UI labels to **中文 + English** at runtime — e.g. the `/search` command reads **联网搜索 Search** in the slash popup, and the better-display card reads **交互阅读 Better Display** on the Plugins page.

No DSH core patching, no other plugin's source touched: everything is a browser-side runtime DOM rewrite, so a DSH update, a plugin update, or a brand-new plugin install keeps working.

- **Covered surfaces**: the slash-command popup, chat/settings tab strips, Plugins-page cards (list + detail).
- **Never touched**: DSH's own copy (Goal / Plan / Compact / General / Chat …), labels that are already Chinese (better-display's 阅读 tab), and the Settings left-nav (several plugins locate nav rows by exact label text — rewriting them breaks those plugins).
- **Three-tier resolution**: curated exact labels → a word glossary that composes unknown labels (`context-status` → `上下文状态`, all-or-nothing) → leave it English.

## Install

```sh
cd /vol1/1000/Deepseek-Harness/工作台/插件/dsh-bilingual-ui
pnpm test
dsh plugin --profile web add link:/vol1/1000/Deepseek-Harness/工作台/插件/dsh-bilingual-ui
# restart DSH; afterwards, editing src only needs `pnpm test` + a page refresh
```

## Develop

`src/bilingual.mjs` is the engine (plain ESM, unit-tested with `node --test`); `scripts/build.mjs` wraps it into `lib/client.js` as a `window.__ModuleLoader__` bundle with zero dependencies. `lib/index.js` is a no-op host half — this plugin is browser-only.

See `README.zh-CN.md` for the full Chinese documentation.
