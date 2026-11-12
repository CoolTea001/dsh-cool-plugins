# dsh-cool-plugins

English | [中文](README.zh.md)

One repository for every DeepSeek Harness (DSH) plugin. Each plugin is still its
own npm package, with its own version and its own install unit — only the source
lives here.

## Packages

<table>
  <thead>
    <tr>
      <th width="160">Package</th>
      <th>What it adds</th>
      <th>Docs</th>
      <th>Published</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="160"><a href="plugins/dsh-cool-theme"><code>dsh-cool-theme</code></a></td>
      <td>Appearance switching: preset themes, custom themes, and theme sharing</td>
      <td><a href="plugins/dsh-cool-theme/README.md"><code>README</code></a></td>
      <td>❌</td>
    </tr>
    <tr>
      <td width="160"><a href="plugins/dsh-cool-terminal"><code>dsh-cool-terminal</code></a></td>
      <td>A real shell in the session tab bar, with workspace sync and command completion</td>
      <td><a href="plugins/dsh-cool-terminal/README.md"><code>README</code></a></td>
      <td>✅</td>
    </tr>
    <tr>
      <td width="160"><a href="plugins/dsh-cool-git"><code>dsh-cool-git</code></a></td>
      <td>A Git panel: view changes, commit, browse history and branches, sync with the remote, resolve conflicts</td>
      <td><a href="plugins/dsh-cool-git/README.md"><code>README</code></a></td>
      <td>✅</td>
    </tr>
    <tr>
      <td width="160"><a href="plugins/dsh-cool-file"><code>dsh-cool-file</code></a></td>
      <td>A Files tab: browse the workspace and preview text files</td>
      <td><a href="plugins/dsh-cool-file/README.md"><code>README</code></a></td>
      <td>❌</td>
    </tr>
    <tr>
      <td width="160"><a href="plugins/dsh-cool-session"><code>dsh-cool-session</code></a></td>
      <td>A Sessions page in Settings: search, filter, archive, and batch delete</td>
      <td><a href="plugins/dsh-cool-session/README.md"><code>README</code></a></td>
      <td>✅</td>
    </tr>
    <tr>
      <td width="160"><a href="plugins/dsh-cool-daily"><code>dsh-cool-daily</code></a></td>
      <td>Daily AI-generated articles from a custom prompt</td>
      <td><a href="plugins/dsh-cool-daily/README.md"><code>README</code></a></td>
      <td>❌</td>
    </tr>
  </tbody>
</table>

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
