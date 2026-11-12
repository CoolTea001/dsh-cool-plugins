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
      <td>✅</td>
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

**Install by npm package name**

Use DSH's add-plugin action and enter the package name, for example
`dsh-cool-theme`.

**Install from local source**

Once the repository is cloned locally, enter the plugin path directly in the
add-plugin panel's input box. For example:
`/Users/xxx/Desktop/dsh-cool-plugins/plugins/dsh-cool-theme`

## Contributing

Issues and pull requests are welcome.

## License

MIT © CoolTea
