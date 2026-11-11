# dsh-cool-plugins

English | [中文](README.zh.md)

One repository for every DeepSeek Harness (DSH) plugin. Each plugin is still its
own npm package, with its own version and its own install unit — only the source
lives here.

## Packages

| Package | What it adds | Docs | Published |
|---|---|---|---|
| [`dsh-cool-theme`](plugins/dsh-cool-theme) | Appearance switching: preset themes, custom themes, and theme sharing | [`README`](plugins/dsh-cool-theme/README.md) | Yes |
| [`dsh-cool-terminal`](plugins/dsh-cool-terminal) | A real shell in the session tab bar, with workspace sync and command completion | [`README`](plugins/dsh-cool-terminal/README.md) | Yes |
| [`dsh-cool-git`](plugins/dsh-cool-git) | A Git panel: view changes, commit, browse history and branches, sync with the remote, resolve conflicts | [`README`](plugins/dsh-cool-git/README.md) | Yes |
| [`dsh-cool-file`](plugins/dsh-cool-file) | A Files tab: browse the workspace and preview text files | [`README`](plugins/dsh-cool-file/README.md) | No |
| [`dsh-cool-session`](plugins/dsh-cool-session) | A Sessions page in Settings: search, filter, archive, and batch delete | [`README`](plugins/dsh-cool-session/README.md) | No |
| [`dsh-cool-daily`](plugins/dsh-cool-daily) | Daily AI-generated articles from a custom prompt | [`README`](plugins/dsh-cool-daily/README.md) | No |

## Installing a plugin

Use DSH's add-plugin action and enter the package name, for example
`dsh-cool-theme`. Packages that are not published yet can be installed locally by
linking the package into a profile, as described under
[Linking into a profile](#linking-into-a-profile).

## Development

```bash
pnpm install
pnpm run check     # locale guard → each package's check → client bundle guard
pnpm run build     # build every package
pnpm run dev       # watch and rebuild every package
```

Requirements: Node `^22.19.0 || >=24.0.0`, pnpm `11.28.9` (pinned by the
`packageManager` field).

## Linking into a profile

A plugin directory can be symlinked into a DSH profile directly, which is also
how the plugins are developed locally:

```bash
dsh plugin --profile desktop add link:<repo>/plugins/dsh-cool-git
```

A symlinked directory is a live working copy, so `lib/` must be rebuilt after
edits.

The Host half needs a DSH restart to load new code; the browser half picks up a
rebuilt `client.js` on reload. Because `lib/` is committed to the repository as
well, a change to source is only complete once the rebuilt output is committed
with it.

## Contributing

Issues and pull requests are welcome.

## License

MIT © CoolTea
